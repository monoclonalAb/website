import { execFileSync, spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const anchor = fileURLToPath(new URL("./owned-command.mjs", import.meta.url));
const pollMilliseconds = 25;

export async function within(promise, milliseconds) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Read-only membership observation. No discovered PID/PGID is ever signalled.
function groupMembers(group) {
  const lines = execFileSync("ps", ["-axo", "pid=,pgid="], {
    encoding: "utf8",
    timeout: 2_000,
  })
    .trim()
    .split("\n");
  return lines.flatMap((line) => {
    const match = /^\s*(\d+)\s+(\d+)\s*$/.exec(line);
    if (!match)
      throw new Error("Process-group inventory was empty or malformed.");
    return Number(match[2]) === group ? [Number(match[1])] : [];
  });
}

async function waitGroup(group, excludeAnchor, milliseconds) {
  const deadline = Date.now() + milliseconds;
  do {
    const members = groupMembers(group);
    if (excludeAnchor && !members.includes(group))
      throw new Error(
        "Live owned anchor missing from process-group inventory.",
      );
    if (!members.some((pid) => !excludeAnchor || pid !== group)) return true;
    if (Date.now() >= deadline) return false;
    await delay(pollMilliseconds);
  } while (true);
}

export function waitOwnedGroupGone(group, milliseconds) {
  return waitGroup(group, false, milliseconds);
}

/** Owns a tiny live group anchor plus a known command and its same-group children.
 * Detached children are NOT covered and need a separate resource owner.
 */
export function spawnOwnedProcess(
  command,
  args,
  { stdio = "inherit", ...options } = {},
) {
  if (process.platform === "win32")
    throw new Error("BLOCKED: owned process cleanup requires POSIX.");
  // Abort/timeout belong to this owner, never spawn's error-before-close path.
  if (options.signal || options.timeout)
    throw new Error("Use the owned cancellation/timeout options.");
  const streams = typeof stdio === "string" ? [stdio, stdio, stdio] : stdio;
  const child = spawn(process.execPath, [anchor], {
    ...options,
    detached: true,
    stdio: [...streams, "ipc"],
  });
  let closedResult;
  let failed = false;
  let resolveResult;
  let resolveReady;
  const result = new Promise((resolve) => {
    resolveResult = resolve;
  });
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const closed = new Promise((resolve) => {
    // Attach even when spawn returned no PID. An error is not closure.
    child.on("error", () => {
      failed = true;
    });
    child.once("close", (code, signal) => {
      closedResult = { code, signal, failed };
      resolveReady(false);
      resolveResult({ code: null, signal, failed: true });
      resolve(closedResult);
    });
  });
  const send = (message) =>
    new Promise((resolve) => {
      if (!child.connected) return resolve(false);
      child.send(message, (error) => resolve(!error));
    });
  child.on("message", (message) => {
    if (message.kind === "ready") {
      void send({ kind: "start", command, args }).then(resolveReady);
    } else if (message.kind === "result") resolveResult(message);
  });
  let stopping;
  return {
    child,
    result,
    closed,
    group: child.pid,
    stop({
      signal = "SIGTERM",
      gracefulMilliseconds = 5_000,
      forceMilliseconds = 5_000,
    } = {}) {
      stopping ??= (async () => {
        if (!(await within(ready, forceMilliseconds))) {
          if (!child.pid && (await within(closed, forceMilliseconds)))
            return closedResult;
          throw new Error(
            "Owned command anchor failed before readiness; cleanup not confirmed.",
          );
        }
        if (closedResult)
          throw new Error(
            "Owned command anchor closed unexpectedly; no saved PID was signalled.",
          );
        const request = async (message) => {
          if (!(await send(message)))
            throw new Error(
              "Owned command anchor unavailable; cleanup not confirmed.",
            );
        };
        await request({ kind: "signal", signal });
        if (await waitGroup(child.pid, true, gracefulMilliseconds)) {
          await request({ kind: "release" });
        } else {
          // The live anchor sends SIGKILL to its own group, including itself.
          await request({ kind: "signal", signal: "SIGKILL" });
        }
        if (!(await within(closed, forceMilliseconds)))
          throw new Error("Owned command anchor was not reaped.");
        // Read-only absence proof after reaping. Never signal a saved group.
        if (!(await waitGroup(child.pid, false, forceMilliseconds)))
          throw new Error(
            "Owned command group absence could not be confirmed.",
          );
        return closedResult;
      })().catch(async (error) => {
        // IPC targets this live helper, never a numeric identity. If observation
        // fails, still request bounded self-cleanup but retain the failed proof.
        await send({ kind: "signal", signal: "SIGKILL" });
        await within(closed, forceMilliseconds);
        throw error;
      });
      return stopping;
    },
  };
}

export function installProcessSignalController() {
  const controller = new AbortController();
  const handlers = new Map();
  for (const [signal, code] of [
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ]) {
    const handler = () => {
      // Repeated signals must not bypass in-progress cleanup.
      if (!controller.signal.aborted) {
        process.exitCode = code;
        controller.abort(signal);
      }
    };
    handlers.set(signal, handler);
    process.on(signal, handler);
  }
  return {
    controller,
    dispose() {
      for (const [signal, handler] of handlers) process.off(signal, handler);
    },
  };
}

export class OwnedProcessCleanupError extends Error {
  constructor(group) {
    super(
      `Owned command group ${group ?? "(not started)"} cleanup could not be confirmed. Inspect only this run; never signal a saved PID/PGID.`,
    );
    this.name = "OwnedProcessCleanupError";
  }
}

export async function runOwnedProcess(
  command,
  args,
  {
    signal,
    timeoutMilliseconds,
    gracefulSignal = "SIGTERM",
    gracefulMilliseconds = 5_000,
    forceMilliseconds = 5_000,
    ...spawnOptions
  },
  failureMessage,
) {
  if (signal?.aborted) throw new Error(failureMessage);
  const owned = spawnOwnedProcess(command, args, spawnOptions);
  let timer;
  let abortHandler;
  try {
    const cancelled = new Promise((resolve) => {
      abortHandler = () => resolve(null);
      signal?.addEventListener("abort", abortHandler, { once: true });
      if (signal?.aborted) abortHandler();
      if (timeoutMilliseconds !== undefined)
        timer = setTimeout(abortHandler, timeoutMilliseconds);
    });
    const result = await Promise.race([owned.result, cancelled]);
    // Even a successful/failed command may have left same-group children alive.
    await owned.stop({
      signal: gracefulSignal,
      gracefulMilliseconds,
      forceMilliseconds,
    });
    if (!result || result.failed || result.code !== 0)
      throw new Error(failureMessage);
  } catch (error) {
    try {
      await owned.stop({
        signal: gracefulSignal,
        gracefulMilliseconds,
        forceMilliseconds,
      });
    } catch {
      throw new OwnedProcessCleanupError(owned.group);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortHandler);
  }
}
