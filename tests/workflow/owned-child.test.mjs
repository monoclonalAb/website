import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import {
  runOwnedProcess,
  spawnOwnedProcess,
} from "../../scripts/owned-child.mjs";

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function waitForFile(path) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      return Number((await readFile(path, "utf8")).trim());
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await delay(20);
    }
  }
  throw new Error("owned child fixture did not become ready");
}

function killFixtureIfStillOwned(pid, uniquePath) {
  if (!alive(pid)) return;
  const command = execFileSync("ps", ["-p", String(pid), "-o", "command="], {
    encoding: "utf8",
  }).trim();
  if (command.includes(uniquePath)) process.kill(pid, "SIGKILL");
}

async function assertPortFree(port) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port, exclusive: true }, resolve);
  });
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function writeListener(path, { ignoreSignals = true } = {}) {
  await writeFile(
    path,
    `
import { writeFileSync } from "node:fs";
import { createServer } from "node:net";
const server = createServer((socket) => socket.end());
${ignoreSignals ? 'process.on("SIGINT", () => {}); process.on("SIGTERM", () => {});' : 'process.on("SIGTERM", () => server.close(() => process.exit(0)));'}
server.listen(Number(process.argv[2]), "127.0.0.1", () => {
  writeFileSync(process.argv[3], String(process.pid));
});
`,
  );
}

async function runOwnedGroupCase(t, mode) {
  const directory = await mkdtemp(join(tmpdir(), "website-owned-child-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const port = await freePort();
  const ready = join(directory, "ready");
  const listener = join(directory, "listener.mjs");
  const parent = join(directory, "parent.mjs");
  await writeListener(listener);

  let command = listener;
  if (mode === "failure") {
    await writeFile(
      parent,
      `
import { writeFileSync } from "node:fs";
import { createServer } from "node:net";
const server = createServer((socket) => socket.end());
server.listen(Number(process.argv[2]), "127.0.0.1", () => {
  writeFileSync(process.argv[3], String(process.pid));
  setTimeout(() => process.exit(1), 100);
});
`,
    );
    command = parent;
  }

  const controller = new AbortController();
  const running = runOwnedProcess(
    process.execPath,
    [command, String(port), ready],
    {
      cwd: directory,
      env: process.env,
      stdio: "ignore",
      signal: controller.signal,
      timeoutMilliseconds: mode === "timeout" ? 350 : 5_000,
      gracefulSignal: mode === "SIGINT" ? "SIGINT" : "SIGTERM",
      gracefulMilliseconds: 100,
      forceMilliseconds: 2_000,
    },
    `owned ${mode} fixture failed`,
  );
  const listenerPid = await waitForFile(ready);
  t.after(() => killFixtureIfStillOwned(listenerPid, command));
  assert.ok(alive(listenerPid));
  if (mode === "SIGINT" || mode === "SIGTERM") controller.abort(mode);

  await assert.rejects(running, new RegExp(`owned ${mode} fixture failed`));
  assert.equal(alive(listenerPid), false);
  await assertPortFree(port);
}

for (const mode of ["SIGTERM", "SIGINT", "timeout", "failure"]) {
  test(`owned direct process group is absent after ${mode === "SIGTERM" ? "early-build SIGTERM" : mode}`, async (t) => {
    await runOwnedGroupCase(t, mode);
  });
}

for (const mode of ["SIGTERM", "SIGINT", "timeout", "failure", "success"]) {
  test(`owned group outlives an early-exiting parent: ${mode}`, async (t) => {
    const directory = await mkdtemp(
      join(tmpdir(), "website-owned-parent-first-"),
    );
    t.after(() => rm(directory, { recursive: true, force: true }));
    const port = await freePort();
    const ready = join(directory, "ready");
    const listener = join(directory, "listener.mjs");
    const runner = join(directory, "runner.mjs");
    await writeListener(listener);
    await writeFile(
      runner,
      `
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
spawn(process.execPath, [${JSON.stringify(listener)}, process.argv[2], process.argv[3]], { stdio: "ignore" });
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));
const mode = ${JSON.stringify(mode)};
setInterval(() => {
  if (existsSync(process.argv[3]) && ["failure", "success"].includes(mode)) process.exit(mode === "failure" ? 1 : 0);
}, 20);
`,
    );
    const controller = new AbortController();
    const running = runOwnedProcess(
      process.execPath,
      [runner, String(port), ready],
      {
        stdio: "ignore",
        signal: controller.signal,
        timeoutMilliseconds: mode === "timeout" ? 500 : 5_000,
        gracefulSignal: mode === "SIGINT" ? "SIGINT" : "SIGTERM",
        gracefulMilliseconds: 100,
        forceMilliseconds: 2_000,
      },
      "parent-first fixture failed",
    );
    // Attach a rejection handler immediately, even if startup itself fails.
    const result = running.then(
      () => null,
      (error) => error,
    );
    const pid = await waitForFile(ready);
    t.after(() => killFixtureIfStillOwned(pid, listener));
    if (mode === "SIGINT" || mode === "SIGTERM") controller.abort(mode);
    const error = await result;
    if (mode === "success") assert.equal(error, null);
    else assert.match(error.message, /parent-first fixture failed/);
    for (let attempt = 0; attempt < 50 && alive(pid); attempt++)
      await delay(20);
    assert.equal(
      alive(pid),
      false,
      "same-group listener must not survive its parent",
    );
    await assertPortFree(port);
  });
}

test("anchor spawn failure is handled even when it has no native PID", async () => {
  await assert.rejects(
    runOwnedProcess(
      process.execPath,
      ["-e", ""],
      {
        cwd: "/nonexistent/website-owned-cwd",
        stdio: "ignore",
        timeoutMilliseconds: 1_000,
      },
      "missing anchor",
    ),
    /missing anchor/,
  );
});

for (const output of ["", "not a process inventory", "1 1"]) {
  test(`failed group inventory (${output || "empty"}) self-cleans but never reports confirmed cleanup`, async (t) => {
    const directory = await mkdtemp(
      join(tmpdir(), "website-owned-ps-failure-"),
    );
    t.after(() => rm(directory, { recursive: true, force: true }));
    const port = await freePort();
    const ready = join(directory, "ready");
    const listener = join(directory, "listener.mjs");
    await writeListener(listener);
    await writeFile(
      join(directory, "ps"),
      `#!/bin/sh\nprintf '%s\\n' '${output}'\n`,
      { mode: 0o700 },
    );
    const owned = spawnOwnedProcess(
      process.execPath,
      [listener, String(port), ready],
      { stdio: "ignore" },
    );
    const pid = await waitForFile(ready);
    t.after(() => killFixtureIfStillOwned(pid, listener));
    const path = process.env.PATH;
    try {
      process.env.PATH = `${directory}:${path}`;
      await assert.rejects(
        owned.stop({ gracefulMilliseconds: 100, forceMilliseconds: 2_000 }),
        /inventory/,
      );
    } finally {
      process.env.PATH = path;
    }
    for (let i = 0; i < 50 && alive(pid); i++) await delay(20);
    assert.equal(alive(pid), false);
    assert.equal(alive(owned.group), false);
    await assertPortFree(port);
  });
}

test("unexpected helper exit fails closed without signalling its saved group", async () => {
  const owned = spawnOwnedProcess(
    process.execPath,
    ["-e", "process.kill(process.ppid, 'SIGKILL')"],
    { stdio: "ignore" },
  );
  await owned.closed;
  await assert.rejects(owned.stop(), /anchor closed unexpectedly/);
  assert.equal(alive(owned.group), false);
});

test("repeated actual SIGTERM/SIGINT cannot bypass group cleanup", async (t) => {
  const directory = await mkdtemp(
    join(tmpdir(), "website-owned-repeat-signal-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  const moduleUrl = new URL("../../scripts/owned-child.mjs", import.meta.url)
    .href;
  const port = await freePort();
  const ready = join(directory, "ready");
  const listener = join(directory, "listener.mjs");
  await writeListener(listener);
  const running = exec(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
import { existsSync } from "node:fs";
import { installProcessSignalController, runOwnedProcess } from ${JSON.stringify(moduleUrl)};
const lifecycle = installProcessSignalController();
const running = runOwnedProcess(process.execPath, ${JSON.stringify([listener, String(port), ready])}, { stdio: "ignore", signal: lifecycle.controller.signal, gracefulMilliseconds: 250, forceMilliseconds: 2000 }, "interrupted fixture");
const timer = setInterval(() => {
  if (!existsSync(${JSON.stringify(ready)})) return;
  clearInterval(timer);
  process.kill(process.pid, "SIGTERM");
  setTimeout(() => process.kill(process.pid, "SIGINT"), 25);
}, 20);
try { await running; } catch { console.log("handled repeated signals"); }
finally { lifecycle.dispose(); }
`,
    ],
    { timeout: 10_000 },
  );
  const result = running.then(
    () => null,
    (error) => error,
  );
  const pid = await waitForFile(ready);
  t.after(() => killFixtureIfStillOwned(pid, listener));
  const error = await result;
  assert.equal(error.code, 143);
  assert.match(error.stdout, /handled repeated signals/);
  assert.equal(alive(pid), false);
  await assertPortFree(port);
});

test("missing executable is a handled rejection, not an uncaught child error", async () => {
  const moduleUrl = new URL("../../scripts/owned-child.mjs", import.meta.url)
    .href;
  const { stdout } = await exec(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
import assert from "node:assert/strict";
import { runOwnedProcess } from ${JSON.stringify(moduleUrl)};
await assert.rejects(runOwnedProcess("/nonexistent/website-owned-executable", [], { stdio: "ignore", timeoutMilliseconds: 1000 }, "missing command"));
await new Promise(resolve => setTimeout(resolve, 100));
console.log("handled missing executable");
`,
    ],
    { timeout: 5_000 },
  );
  assert.match(stdout, /handled missing executable/);
});
