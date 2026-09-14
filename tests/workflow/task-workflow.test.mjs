import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync, spawn } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import {
  fingerprint,
  loadTask,
  recordReview,
  reviewRequest,
  runCheck,
  taskStatus,
} from "../../scripts/task-workflow.mjs";

const cli = fileURLToPath(
  new URL("../../scripts/task-workflow.mjs", import.meta.url),
);
function fixture(t, options = {}) {
  const root = mkdtempSync(join(tmpdir(), "website-workflow-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet", root]);
  mkdirSync(join(root, "src"));
  mkdirSync(join(root, "generated"));
  writeFileSync(join(root, "src/model.txt"), "baseline");
  writeFileSync(
    join(root, "contract.md"),
    "Stable boundary and acceptance contract.",
  );
  writeFileSync(join(root, ".gitignore"), "generated/\n.task-workflow/\n");
  writeFileSync(join(root, "package.json"), "{}");
  execFileSync("git", ["add", "src/model.txt"], { cwd: root });
  const packet = {
    version: 1,
    id: "fixture",
    outcome:
      "Exercise the CLI using inert fixture checks, not application acceptance.",
    contract: "contract.md",
    boundary: ["No external resources or real review."],
    inputs: ["src"],
    boundaryInputs: [],
    ownerInput: options.ownerInput ?? [],
    outOfScope: ["Deployment"],
    checks: [
      {
        id: "fast",
        phase: "fast",
        argv: [process.execPath, "-e", options.code ?? "process.exit(0)"],
        timeoutSeconds: options.timeout ?? 10,
        cleanupSeconds: 2,
      },
      {
        id: "full",
        phase: "full",
        argv: [process.execPath, "-e", "process.exit(0)"],
        timeoutSeconds: 10,
        cleanupSeconds: 2,
      },
    ],
  };
  const path = join(root, "packet.json");
  const save = () => writeFileSync(path, JSON.stringify(packet));
  save();
  const load = () => loadTask(path, root);
  const receipt = () =>
    JSON.parse(
      readFileSync(
        join(root, ".task-workflow/fixture/check-fast.json"),
        "utf8",
      ),
    );
  const review = (kind, overrides = {}) => {
    const request = reviewRequest(load(), kind);
    const report = {
      ...request,
      reviewer: "INERT UNIT FIXTURE — not an independent reviewer",
      decision: "approved",
      coverage: "Fixture source and assertions only",
      summary: "Synthetic review record for workflow testing",
      findings: [],
      ...overrides,
    };
    // Reports must be outside repository source; use the designated ignored directory.
    mkdirSync(join(root, ".task-workflow/reports"), { recursive: true });
    const file = join(root, ".task-workflow/reports", kind + ".json");
    writeFileSync(file, JSON.stringify(report));
    recordReview(load(), kind, file);
    return file;
  };
  return { root, path, packet, save, load, receipt, review };
}
async function complete(f) {
  assert.equal(await runCheck(f.load(), "fast"), "passed");
  f.review("boundary");
  assert.equal(await runCheck(f.load(), "full"), "passed");
  f.review("final");
}

test("status is read-only, exposes next action, and full verification is gated", async (t) => {
  const f = fixture(t);
  const status = taskStatus(f.load());
  assert.equal(status.ready, false);
  assert.match(status.next, /Run fast/);
  assert.equal(existsSync(join(f.root, ".task-workflow")), false);
  await assert.rejects(runCheck(f.load(), "full"), /Current fast/);
  assert.equal(existsSync(join(f.root, ".task-workflow")), false);
  assert.throws(
    () => recordReview(f.load(), "boundary", "missing.json"),
    /required current checks/,
  );
  let result;
  try {
    execFileSync(process.execPath, [cli, "status", f.path], {
      cwd: f.root,
      encoding: "utf8",
    });
  } catch (e) {
    result = e;
  }
  assert.equal(result.status, 1);
  assert.match(result.stdout, /OUT OF SCOPE: Deployment/);
  assert.equal(existsSync(join(f.root, ".task-workflow")), false);
});
test("actual explicit checks plus matching review artifacts clear only local evidence", async (t) => {
  const f = fixture(t);
  await complete(f);
  const status = taskStatus(f.load());
  assert.equal(status.ready, true);
  assert.match(status.next, /not release approval/);
  assert.deepEqual(Object.keys(f.receipt()).sort(), [
    "finished",
    "started",
    "status",
    "subject",
    "version",
  ]);
  const output = execFileSync(process.execPath, [cli, "status", f.path], {
    cwd: f.root,
    encoding: "utf8",
  });
  assert.match(output, /independence is not machine-authenticated/);
  writeFileSync(join(f.root, "src/new.txt"), "untracked source");
  assert.equal(taskStatus(f.load()).checks[0].state, "stale");
  assert.equal(
    taskStatus(f.load()).reviews[0].state,
    "approved",
    "Implementation change does not erase stable design review",
  );
  assert.equal(taskStatus(f.load()).reviews[1].state, "stale");
});
test("whole-repository checks exclude their own receipts and bind other source", async (t) => {
  const f = fixture(t);
  f.packet.checks[1].inputs = ["."];
  f.save();
  await complete(f);
  assert.equal(taskStatus(f.load()).ready, true);
  writeFileSync(join(f.root, "generated/ignored"), "derived output");
  assert.equal(taskStatus(f.load()).ready, true);
  writeFileSync(join(f.root, "outside-subject.md"), "new repository source");
  const status = taskStatus(f.load());
  assert.equal(status.checks[0].state, "passed");
  assert.equal(status.checks[1].state, "stale");
  assert.equal(status.ready, false);
});
test("tracked deletion, packet/command edits, contract and dependency changes invalidate identity", async (t) => {
  const f = fixture(t);
  const first = fingerprint(f.load(), "final");
  unlinkSync(join(f.root, "src/model.txt"));
  assert.notEqual(fingerprint(f.load(), "final"), first);
  writeFileSync(join(f.root, "src/model.txt"), "baseline");
  assert.equal(fingerprint(f.load(), "final"), first);
  writeFileSync(join(f.root, "package.json"), '{"changed":true}');
  assert.notEqual(fingerprint(f.load(), "final"), first);
  const boundary = fingerprint(f.load(), "boundary");
  writeFileSync(join(f.root, "contract.md"), "Changed authority.");
  assert.notEqual(fingerprint(f.load(), "boundary"), boundary);
  const changed = fingerprint(f.load(), "final");
  f.packet.checks[0].argv.push("extra");
  f.save();
  assert.notEqual(fingerprint(f.load(), "final"), changed);
});
test("ignored explicit contracts/inputs fail closed instead of disappearing from identity", (t) => {
  const f = fixture(t);
  writeFileSync(
    join(f.root, "generated/contract.md"),
    "Ignored but substantive contract",
  );
  f.packet.contract = "generated/contract.md";
  f.save();
  assert.throws(f.load, /explicitly declared input is ignored/);
  f.packet.contract = "contract.md";
  f.packet.inputs = ["generated"];
  f.save();
  assert.throws(f.load, /explicitly declared input is ignored/);
});
test("chmod-only executable changes invalidate checks and implementation review", async (t) => {
  const f = fixture(t);
  const program = join(f.root, "src/run.sh");
  writeFileSync(program, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  f.packet.checks[0].argv = [program];
  f.save();
  await complete(f);
  assert.equal(taskStatus(f.load()).ready, true);
  chmodSync(program, 0o644);
  const status = taskStatus(f.load());
  assert.equal(status.checks[0].state, "stale");
  assert.equal(status.reviews[1].state, "stale");
  assert.equal(status.ready, false);
});
test("source changes during a successful command cannot produce a current pass", async (t) => {
  const f = fixture(t, {
    code: "require('node:fs').writeFileSync('src/model.txt','changed')",
  });
  assert.equal(await runCheck(f.load(), "fast"), "changed");
  assert.equal(taskStatus(f.load()).ready, false);
  assert.equal(f.receipt().status, "changed");
});
test("nonzero and timed-out commands record failure and release only confirmed ownership", async (t) => {
  for (const code of ["process.exit(7)", "setInterval(()=>{},1000)"]) {
    const f = fixture(t, { code, timeout: 1 });
    assert.equal(await runCheck(f.load(), "fast"), "failed");
    assert.equal(f.receipt().status, "failed");
    assert.equal(existsSync(join(f.root, ".task-workflow/run.lock")), false);
  }
});
test("a rerun supersedes its old pass before work, holds an exclusive lock, and drains SIGTERM", async (t) => {
  const f = fixture(t, {
    code: "const fs=require('node:fs');if(fs.existsSync('generated/hold')){fs.writeFileSync('generated/started','1');setInterval(()=>{},1000)}",
  });
  assert.equal(await runCheck(f.load(), "fast"), "passed");
  writeFileSync(join(f.root, "generated/hold"), "1");
  const child = spawn(process.execPath, [cli, "run", f.path, "fast"], {
    cwd: f.root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (b) => {
    output += b;
  });
  child.stderr.on("data", (b) => {
    output += b;
  });
  const done = new Promise((resolve) => child.once("close", resolve));
  try {
    for (
      let n = 0;
      n < 100 && !existsSync(join(f.root, "generated/started"));
      n++
    )
      await delay(20);
    assert.equal(existsSync(join(f.root, "generated/started")), true);
    assert.equal(f.receipt().status, "running");
    assert.equal(taskStatus(f.load()).locked, true);
    await assert.rejects(runCheck(f.load(), "fast"), /locked/);
    assert.equal(child.kill("SIGTERM"), true);
    assert.equal(await done, 143);
    assert.equal(f.receipt().status, "failed");
    assert.equal(taskStatus(f.load()).locked, false);
    assert.ok(!output.includes("Local evidence current"));
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await done;
    }
  }
});
test("reviews reject stale/wrong/unresolved attestations and changed or missing artifacts", async (t) => {
  const f = fixture(t);
  await runCheck(f.load(), "fast");
  assert.throws(() => f.review("boundary", { reviewer: "" }), /Invalid review/);
  assert.throws(
    () => f.review("boundary", { findings: ["unresolved"] }),
    /Invalid review/,
  );
  assert.throws(
    () => f.review("boundary", { subject: "0".repeat(64) }),
    /does not match/,
  );
  assert.throws(
    () => f.review("boundary", { task: "other" }),
    /does not match/,
  );
  const report = f.review("boundary");
  writeFileSync(report, readFileSync(report, "utf8") + " ");
  assert.equal(taskStatus(f.load()).reviews[0].state, "stale");
  unlinkSync(report);
  assert.equal(taskStatus(f.load()).reviews[0].state, "stale");
});
test("owner input blocks closure; exclusions are not silently treated as approved", async (t) => {
  const f = fixture(t, {
    ownerInput: ["Owner must supply the authorized device"],
  });
  await complete(f);
  const status = taskStatus(f.load());
  assert.equal(status.ready, false);
  assert.match(status.next, /Owner input/);
  assert.deepEqual(status.outOfScope, ["Deployment"]);
});
test("malformed receipts and stale cleanup locks never yield completion or automatic reclamation", async (t) => {
  const f = fixture(t);
  await complete(f);
  writeFileSync(
    join(f.root, ".task-workflow/fixture/check-fast.json"),
    "invalid",
  );
  assert.equal(taskStatus(f.load()).checks[0].state, "invalid");
  const lock = join(f.root, ".task-workflow/run.lock");
  writeFileSync(lock, '{"reason":"unconfirmed cleanup","pid":999999}');
  assert.equal(taskStatus(f.load()).ready, false);
  await assert.rejects(runCheck(f.load(), "fast"), /locked/);
  assert.equal(existsSync(lock), true);
});
test("scope validation refuses missing/secret/symlink inputs and malformed metadata without contents", (t) => {
  const f = fixture(t);
  for (const input of [
    "missing",
    "../outside",
    ".env",
    ".task-workflow",
    "src//",
    "src/.",
  ]) {
    f.packet.inputs = [input];
    f.save();
    assert.throws(f.load);
  }
  symlinkSync("model.txt", join(f.root, "src/link"));
  f.packet.inputs = ["src"];
  f.save();
  assert.throws(f.load, /Symlink/);
  unlinkSync(join(f.root, "src/link"));
  symlinkSync("missing-target", join(f.root, "src/link"));
  assert.throws(f.load, /Symlink/);
  unlinkSync(join(f.root, "src/link"));
  f.packet.checks = [];
  f.save();
  assert.throws(f.load, /Invalid task packet/);
  writeFileSync(f.path, '{"FAKE-SECRET-DO-NOT-LOG": invalid}');
  let failure;
  try {
    execFileSync(process.execPath, [cli, "status", f.path], {
      cwd: f.root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    failure = e;
  }
  assert.equal(failure.status, 2);
  assert.ok(!failure.stderr.includes("FAKE-SECRET-DO-NOT-LOG"));
});
