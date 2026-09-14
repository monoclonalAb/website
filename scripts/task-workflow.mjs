import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  installProcessSignalController,
  OwnedProcessCleanupError,
  runOwnedProcess,
} from "./owned-child.mjs";

const id = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const text = z.string().min(1).max(4096);
const inputs = z.array(text).min(1).max(64);
const checkSchema = z.strictObject({
  id,
  phase: z.enum(["fast", "full"]),
  argv: z.array(z.string().min(1).max(8192)).min(1).max(64),
  timeoutSeconds: z.number().int().min(1).max(86400),
  cleanupSeconds: z.number().int().min(1).max(600),
  inputs: inputs.optional(),
});
const packetSchema = z.strictObject({
  version: z.literal(1),
  id,
  outcome: text,
  contract: text,
  boundary: z.array(text).min(1).max(32),
  inputs,
  boundaryInputs: z.array(text).max(64),
  ownerInput: z.array(text).max(32),
  outOfScope: z.array(text).max(32),
  checks: z.array(checkSchema).min(2).max(32),
});
const kindSchema = z.enum(["boundary", "final"]);
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const reviewSchema = z
  .strictObject({
    task: id,
    kind: kindSchema,
    subject: digestSchema,
    reviewer: text,
    decision: z.enum(["approved", "changes-requested"]),
    coverage: text,
    summary: text,
    findings: z.array(text).max(64),
  })
  .refine((r) => r.decision !== "approved" || r.findings.length === 0);
const receiptSchema = z.strictObject({
  version: z.literal(1),
  subject: digestSchema,
  status: z.enum([
    "running",
    "passed",
    "failed",
    "changed",
    "cleanup-unconfirmed",
  ]),
  started: z.iso.datetime(),
  finished: z.iso.datetime().optional(),
});
const reviewReceiptSchema = z.strictObject({
  version: z.literal(1),
  subject: digestSchema,
  report: text,
  reportHash: digestSchema,
});
const stateName = ".task-workflow";
const toolFiles = [
  "task-workflow.mjs",
  "owned-child.mjs",
  "owned-command.mjs",
].map((p) => fileURLToPath(new URL(p, import.meta.url)));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const refuse = (message) => {
  throw new Error(message);
};
function parsed(schema, value, name) {
  const result = schema.safeParse(value);
  if (!result.success)
    refuse(
      `Invalid ${name}; inspect its documented schema (values not logged).`,
    );
  return result.data;
}
function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    refuse("Invalid JSON metadata; contents are not logged.");
  }
}
function json(path) {
  if (statSync(path).size > 131072) refuse("Metadata file exceeds128KiB.");
  return parseJson(readFileSync(path, "utf8"));
}
function noSymlinks(root, path) {
  const parts = relative(root, path).split(sep).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink())
        refuse(
          "Symlink paths are not supported; select explicit owned inputs/state.",
        );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
function inside(root, value, source = true) {
  if (
    isAbsolute(value) ||
    value.split(/[\\/]/).includes("..") ||
    /[\x00-\x1f\\]/.test(value)
  )
    refuse("Paths must be normalized repository-relative paths.");
  const path = resolve(root, value);
  if (value !== (relative(root, path) || "."))
    refuse("Paths must be normalized repository-relative paths.");
  noSymlinks(root, path);
  if (
    source &&
    relative(root, path)
      .split(sep)
      .some(
        (p) =>
          p === stateName ||
          p === ".git" ||
          p === "node_modules" ||
          p === ".next" ||
          p.startsWith(".env") ||
          /\.(pem|p12|key)$/.test(p),
      )
  )
    refuse("Generated/state/secret paths are not source inputs.");
  return path;
}
function sourceManifest(root, selected) {
  for (const input of selected)
    if (!existsSync(inside(root, input)))
      refuse(
        `Missing declared input: ${input}. Use its existing parent directory for planned new files.`,
      );
  // An explicit ignored declaration is not an empty source scope. Directory
  // inventory still excludes generated children; tracked inputs override ignores.
  if (selected.length) {
    let ignored = "";
    try {
      ignored = execFileSync("git", ["check-ignore", "--stdin", "-z"], {
        cwd: root,
        input: selected.join("\0") + "\0",
        stdio: ["pipe", "pipe", "pipe"],
      }).toString();
    } catch (error) {
      if (error.status !== 1)
        refuse("Could not validate declared input ignore status.");
    }
    if (ignored)
      refuse(
        "An explicitly declared input is ignored; track/select source rather than silently omitting it.",
      );
  }
  const listed = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, maxBuffer: 16777216, stdio: ["ignore", "pipe", "pipe"] },
  )
    .toString()
    .split("\0")
    .filter(Boolean);
  const wanted = [...new Set(listed)]
    .filter(
      (file) =>
        !file.startsWith(stateName + "/") &&
        selected.some(
          (input) =>
            input === "." ||
            file === input ||
            file.startsWith(input.replace(/\/$/, "") + "/"),
        ),
    )
    .sort();
  const manifest = wanted.map((file) => {
    const path = inside(root, file);
    return existsSync(path)
      ? [file, lstatSync(path).mode & 0o111, sha(readFileSync(path))]
      : [file, "deleted"];
  });
  // Directory membership/empty input markers are part of identity as well.
  return [selected, manifest];
}
export function loadTask(packetPath, cwd = process.cwd()) {
  const root = realpathSync(
    execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    })
      .toString()
      .trim(),
  );
  const path = inside(
    root,
    relative(root, realpathSync(resolve(cwd, packetPath))),
  );
  const raw = readFileSync(path, "utf8");
  if (Buffer.byteLength(raw) > 131072) refuse("Task packet exceeds128KiB.");
  const packet = parsed(packetSchema, parseJson(raw), "task packet");
  if (
    new Set(packet.checks.map((c) => c.id)).size !== packet.checks.length ||
    !["fast", "full"].every((phase) =>
      packet.checks.some((c) => c.phase === phase),
    )
  )
    refuse(
      "Check IDs must be unique, with at least one fast and one full check.",
    );
  if (!existsSync(inside(root, packet.contract)))
    refuse("Missing contract document.");
  const directory = inside(root, join(stateName, packet.id), false);
  const task = { root, path, raw, packet, directory };
  // Validate all scopes even when no receipt exists yet.
  for (const selected of [
    packet.inputs,
    [packet.contract],
    packet.boundaryInputs,
    ...packet.checks.filter((c) => c.inputs).map((c) => c.inputs),
  ])
    sourceManifest(root, selected);
  return task;
}
export function fingerprint(task, kind, check) {
  const selected = [
    ...new Set([
      ...(kind === "boundary"
        ? task.packet.boundaryInputs
        : (check?.inputs ?? task.packet.inputs)),
      task.packet.contract,
    ]),
  ];
  const metadata =
    kind === "boundary"
      ? []
      : [
          process.version,
          toolFiles.map((p) => [p.split(sep).at(-1), sha(readFileSync(p))]),
          ["package.json", "pnpm-lock.yaml", ".gitignore"].map((p) => [
            p,
            existsSync(join(task.root, p))
              ? sha(readFileSync(inside(task.root, p)))
              : "absent",
          ]),
        ];
  return sha(
    JSON.stringify([
      "task-workflow-v1",
      relative(task.root, task.path),
      task.raw,
      kind,
      check?.id ?? null,
      metadata,
      sourceManifest(task.root, selected),
    ]),
  );
}
function receiptPath(task, name) {
  return inside(
    task.root,
    relative(task.root, join(task.directory, name + ".json")),
    false,
  );
}
function readRecord(path, schema) {
  if (!existsSync(path)) return null;
  return parsed(schema, json(path), "local receipt");
}
function writeRecord(task, name, value) {
  noSymlinks(task.root, task.directory);
  mkdirSync(task.directory, { recursive: true, mode: 0o700 });
  const target = receiptPath(task, name),
    temp = target + "." + randomUUID() + ".tmp";
  try {
    writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
    renameSync(temp, target);
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}
function checkState(task, check) {
  const subject = fingerprint(task, "check", check);
  try {
    const record = readRecord(
      receiptPath(task, "check-" + check.id),
      receiptSchema,
    );
    return {
      id: check.id,
      phase: check.phase,
      state: !record
        ? "missing"
        : record.subject !== subject
          ? "stale"
          : record.status,
      subject,
    };
  } catch {
    return { id: check.id, phase: check.phase, state: "invalid", subject };
  }
}
function reviewState(task, kind) {
  const subject = fingerprint(task, kind);
  try {
    const record = readRecord(
      receiptPath(task, "review-" + kind),
      reviewReceiptSchema,
    );
    if (!record) return { kind, state: "missing", subject };
    if (
      record.subject !== subject ||
      !existsSync(record.report) ||
      statSync(record.report).size > 131072 ||
      sha(readFileSync(record.report)) !== record.reportHash
    )
      return { kind, state: "stale", subject };
    const report = parsed(reviewSchema, json(record.report), "review report");
    if (
      report.subject !== subject ||
      report.task !== task.packet.id ||
      report.kind !== kind
    )
      return { kind, state: "invalid", subject };
    return {
      kind,
      state: report.decision,
      subject,
      reviewer: report.reviewer,
      report: record.report,
    };
  } catch {
    return { kind, state: "invalid", subject };
  }
}
export function taskStatus(task) {
  const checks = task.packet.checks.map((check) => checkState(task, check));
  const reviews = ["boundary", "final"].map((kind) => reviewState(task, kind));
  const locked = existsSync(
    inside(task.root, join(stateName, "run.lock"), false),
  );
  const fast = checks.filter((c) => c.phase === "fast" && c.state !== "passed");
  const full = checks.filter((c) => c.phase === "full" && c.state !== "passed");
  const next = locked
    ? "Existing run/uncertain cleanup: establish ownership; do not reclaim its lock automatically."
    : fast.length
      ? `Run fast checks: ${fast.map((c) => c.id).join(", ")}`
      : reviews[0].state !== "approved"
        ? "Obtain/record current independent boundary review before full integration checks."
        : full.length
          ? `Run full checks: ${full.map((c) => c.id).join(", ")}`
          : reviews[1].state !== "approved"
            ? "Obtain/record final implementation review for the current subject."
            : task.packet.ownerInput.length
              ? "Owner input remains required; do not expand authority."
              : "Local evidence current. Integration owner must inspect review independence, coverage and actual outcome; this is not release approval.";
  const ready =
    !locked &&
    checks.every((c) => c.state === "passed") &&
    reviews.every((r) => r.state === "approved") &&
    task.packet.ownerInput.length === 0;
  return {
    task: task.packet.id,
    outcome: task.packet.outcome,
    ready,
    locked,
    checks,
    reviews,
    ownerInput: task.packet.ownerInput,
    outOfScope: task.packet.outOfScope,
    next,
  };
}
export function reviewRequest(task, kind) {
  parsed(kindSchema, kind, "review kind");
  return {
    task: task.packet.id,
    kind,
    subject: fingerprint(task, kind),
    reviewer: "",
    decision: "changes-requested",
    coverage: "",
    summary: "",
    findings: [
      "Review pending: inspect the contract, input scope, affected callers and failure ordering. Do not author this report on the reviewer's behalf.",
    ],
  };
}
export function recordReview(task, kind, reportPath) {
  parsed(kindSchema, kind, "review kind");
  const status = taskStatus(task);
  if (
    status.checks.some(
      (c) => c.state !== "passed" && (kind === "final" || c.phase === "fast"),
    ) ||
    status.locked ||
    (kind === "final" && status.reviews[0].state !== "approved")
  )
    refuse(
      "Run the required current checks and boundary review before recording review.",
    );
  const path = realpathSync(resolve(reportPath));
  const report = parsed(reviewSchema, json(path), "review report");
  if (
    report.task !== task.packet.id ||
    report.kind !== kind ||
    report.subject !== fingerprint(task, kind)
  )
    refuse(
      "Review does not match the current task/kind/subject; request a fresh review.",
    );
  // Do not allow a recorded report to become part of its own subject.
  const rel = relative(task.root, path);
  if (
    !rel.startsWith("..") &&
    !isAbsolute(rel) &&
    !rel.startsWith(stateName + sep)
  )
    refuse(
      "Keep review artifacts outside repository source (for example /tmp or .task-workflow). ",
    );
  writeRecord(task, "review-" + kind, {
    version: 1,
    subject: report.subject,
    report: path,
    reportHash: sha(readFileSync(path)),
  });
}
export async function runCheck(task, checkId) {
  const check = task.packet.checks.find((c) => c.id === checkId);
  if (!check) refuse("Unknown check ID; no command executed.");
  const status = taskStatus(task);
  if (
    check.phase === "full" &&
    (status.checks.some((c) => c.phase === "fast" && c.state !== "passed") ||
      status.reviews[0].state !== "approved")
  )
    refuse(
      "Current fast checks and boundary review are required before full verification.",
    );
  const state = inside(task.root, stateName, false);
  mkdirSync(state, { recursive: true, mode: 0o700 });
  const lock = join(state, "run.lock");
  let fd;
  try {
    fd = openSync(lock, "wx", 0o600);
  } catch {
    refuse(
      "Workflow run locked. Establish actual ownership/cleanup before removing a stale lock; no process will be signalled.",
    );
  }
  const identity = fstatSync(fd);
  let lifecycle,
    uncertainCleanup = false;
  try {
    writeFileSync(
      fd,
      JSON.stringify({
        task: task.packet.id,
        check: check.id,
        pid: process.pid,
        started: new Date().toISOString(),
      }),
    );
    lifecycle = installProcessSignalController();
    const record = {
      version: 1,
      subject: fingerprint(task, "check", check),
      status: "running",
      started: new Date().toISOString(),
    };
    writeRecord(task, "check-" + check.id, record); // supersede a previous pass BEFORE starting
    let passed = false;
    try {
      await runOwnedProcess(
        check.argv[0],
        check.argv.slice(1),
        {
          cwd: task.root,
          env: process.env,
          stdio: "inherit",
          signal: lifecycle.controller.signal,
          timeoutMilliseconds: check.timeoutSeconds * 1000,
          gracefulMilliseconds: check.cleanupSeconds * 1000,
        },
        "Check failed or was interrupted; see its terminal output.",
      );
      passed = !lifecycle.controller.signal.aborted;
    } catch (error) {
      uncertainCleanup = error instanceof OwnedProcessCleanupError;
    }
    const current = loadTask(task.path, task.root);
    const unchanged = fingerprint(current, "check", check) === record.subject;
    record.status = uncertainCleanup
      ? "cleanup-unconfirmed"
      : !passed
        ? "failed"
        : unchanged
          ? "passed"
          : "changed";
    record.finished = new Date().toISOString();
    writeRecord(task, "check-" + check.id, record);
    return record.status;
  } finally {
    lifecycle?.dispose();
    closeSync(fd);
    if (!uncertainCleanup && existsSync(lock)) {
      const now = lstatSync(lock);
      if (now.dev === identity.dev && now.ino === identity.ino)
        unlinkSync(lock);
    }
  }
}
async function main() {
  const [command, path, argument, report] = process.argv.slice(2);
  if (!path || !["status", "run", "review-request", "review"].includes(command))
    refuse(
      "Usage: pnpm workflow status|run|review-request|review <packet> [check|boundary|final] [report.json]",
    );
  const task = loadTask(path);
  if (command === "review-request") {
    console.log(JSON.stringify(reviewRequest(task, argument), null, 2));
    return;
  }
  if (command === "run") {
    const result = await runCheck(task, argument);
    console.log(`${argument}: ${result}`);
    if (result !== "passed") process.exitCode ||= 1;
  }
  if (command === "review") recordReview(task, argument, report);
  const status = taskStatus(loadTask(path));
  console.log(`${status.task}: ${status.outcome}`);
  for (const c of status.checks)
    console.log(`check ${c.phase}/${c.id}: ${c.state}`);
  for (const r of status.reviews)
    console.log(
      `review ${r.kind}: ${r.state} (reviewer independence is not machine-authenticated)`,
    );
  for (const item of status.ownerInput) console.log(`OWNER INPUT: ${item}`);
  for (const item of status.outOfScope) console.log(`OUT OF SCOPE: ${item}`);
  console.log(`NEXT: ${status.next}`);
  if (command === "status" && !status.ready) process.exitCode = 1;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Workflow failed; no completion claim.",
    );
    process.exitCode ||= 2;
  });
