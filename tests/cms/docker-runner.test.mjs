import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { localDockerEndpoint } from "../../scripts/test-cms-docker.mjs";

const exec = promisify(execFile);
const runner = fileURLToPath(
  new URL("../../scripts/test-cms-docker.mjs", import.meta.url),
);

test("Docker test provisioning accepts local sockets and respects explicit context precedence", () => {
  const socket = "unix:///var/run/docker.sock";
  const other = "unix:///tmp/test-docker.sock";
  assert.equal(localDockerEndpoint({}, socket), socket);
  assert.equal(localDockerEndpoint({ DOCKER_HOST: other }, socket), other);
  assert.equal(
    localDockerEndpoint(
      { DOCKER_CONTEXT: "local", DOCKER_HOST: "tcp://remote:2375" },
      socket,
    ),
    socket,
  );
});

test("Docker test provisioning refuses remote/invalid endpoints without echoing them", () => {
  for (const endpoint of [
    undefined,
    "",
    "not-a-url",
    "tcp://remote:2375",
    "tcp://127.0.0.1:2375",
    "ssh://user:never-output-me@remote",
    "https://remote",
    "unix://remote/socket",
    "unix:///",
    "unix:relative",
    "unix:///socket?secret=never-output-me",
    "unix:///socket#never-output-me",
  ]) {
    assert.throws(
      () => localDockerEndpoint({ DOCKER_HOST: endpoint }, undefined),
      (error) =>
        /BLOCKED/.test(error.message) &&
        !error.message.includes("never-output-me"),
    );
  }
  assert.throws(
    () =>
      localDockerEndpoint(
        {
          DOCKER_CONTEXT: "remote",
          DOCKER_HOST: "unix:///var/run/docker.sock",
        },
        "ssh://remote",
      ),
    /BLOCKED/,
  );
});

// Lifecycle unit stubs ONLY: these never invoke Docker/Postgres and cannot
// establish SQL behavior. Real integration stays in test:cms:docker/test:cms:db.
const dockerStub = `#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
const command = args[2];
const base = process.env.CMS_DOCKER_STUB_DIR;
const state = base + "/container";
appendFileSync(base + "/calls", JSON.stringify(args) + "\\n");
if (command === "version") console.log("29.4.0");
else if (command === "image") console.log("postgres@sha256:" + "a".repeat(64));
else if (command === "create") {
  const labels = args.filter((_, i) => args[i - 1] === "--label");
  writeFileSync(state, labels.find((label) => label.startsWith("website.cms.test-run=")));
  if (process.env.CMS_DOCKER_STUB_FAIL === "create") process.exit(1);
  console.log("a".repeat(64));
} else if (command === "start" && process.env.CMS_DOCKER_STUB_FAIL === "start") process.exit(1);
else if (command === "port") console.log("127.0.0.1:54321");
else if (command === "exec" && args.includes("-i")) {
  process.stdin.resume(); // Do not record secret-bearing bootstrap SQL.
} else if (command === "exec" && args.includes("SHOW server_version")) console.log("17.test-stub");
else if (command === "container" && existsSync(state)) {
  if (!args.includes("label=" + readFileSync(state, "utf8"))) process.exit(2);
  console.log("a".repeat(64));
} else if (command === "rm") unlinkSync(state);
`;
const pnpmStub = `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
appendFileSync(process.env.CMS_DOCKER_STUB_DIR + "/phases", "test:cms:db\\n");
if (process.env.DATABASE_URL || !process.env.CMS_TEST_DATABASE_CONFIRM.startsWith("website_cms_test_")) process.exit(2);
if (process.env.CMS_DOCKER_STUB_FAIL === "tests") process.exit(1);
if (process.env.CMS_DOCKER_STUB_FAIL === "interrupt") {
  process.kill(process.ppid, "SIGTERM");
  setInterval(() => {}, 1000);
}
`;

for (const failure of ["none", "create", "start", "tests", "interrupt"]) {
  test(`Docker runner lifecycle stub: ${failure === "none" ? "success" : failure + " failure"} cleans only this run's container`, async (t) => {
    const dir = await mkdtemp(join(tmpdir(), "cms-docker-unit-"));
    t.after(() => rm(dir, { recursive: true, force: true }));
    await writeFile(join(dir, "docker"), dockerStub, { mode: 0o700 });
    await writeFile(join(dir, "pnpm"), pnpmStub, { mode: 0o700 });
    const env = {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      DOCKER_HOST: "unix:///unit-test-only.sock",
      CMS_DOCKER_STUB_DIR: dir,
      CMS_DOCKER_STUB_FAIL: failure,
      DATABASE_URL: "never-output-me",
      CMS_TEST_DATABASE_URL: "never-output-me",
      CMS_TEST_DATABASE_CONFIRM: "never-output-me",
    };
    delete env.DOCKER_CONTEXT;
    let output;
    try {
      output = await exec(process.execPath, [runner], { env, timeout: 15_000 });
      assert.equal(failure, "none");
    } catch (error) {
      assert.notEqual(failure, "none");
      assert.equal(error.code, failure === "interrupt" ? 143 : 1);
      output = error;
    }
    assert.ok(!`${output.stdout}${output.stderr}`.includes("never-output-me"));
    await assert.rejects(readFile(join(dir, "container")), { code: "ENOENT" });
    const calls = (await readFile(join(dir, "calls"), "utf8"))
      .trim()
      .split("\n")
      .map(JSON.parse);
    assert.ok(
      calls.every(
        (args) => args[0] === "--host" && args[1] === env.DOCKER_HOST,
      ),
    );
    const create = calls.find((args) => args[2] === "create");
    assert.ok(create.includes("127.0.0.1::5432"));
    assert.ok(create.includes("/var/lib/postgresql/data:rw,nosuid,size=256m"));
    assert.ok(create.includes("--rm"));
    const cleanup = calls.filter((args) => args[2] === "rm");
    assert.deepEqual(cleanup, [
      ["--host", env.DOCKER_HOST, "rm", "--force", "--volumes", "a".repeat(64)],
    ]);
    if (["none", "tests", "interrupt"].includes(failure)) {
      const phases = (await readFile(join(dir, "phases"), "utf8"))
        .trim()
        .split("\n");
      assert.equal(phases.length, failure === "none" ? 2 : 1);
    }
  });
}
