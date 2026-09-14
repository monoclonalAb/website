import { spawn } from "node:child_process";

// Tiny POSIX group anchor, not a process-tree supervisor. Only this live group
// leader signals its own group. Keep it alive after the command exits so the
// caller can remove same-group children without ever using a stale numeric PGID.
if (!process.send)
  throw new Error("Owned command requires its parent IPC channel.");
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {});
const killGroup = (signal) => process.kill(-process.pid, signal);
process.on("disconnect", () => killGroup("SIGKILL"));
let started = false;
process.on("message", (message) => {
  if (message.kind === "start" && !started) {
    started = true;
    let failed = false;
    try {
      const command = spawn(message.command, message.args, {
        stdio: "inherit",
      });
      command.on("error", () => {
        failed = true;
      });
      command.once("close", (code, signal) => {
        if (process.connected)
          process.send({ kind: "result", code, signal, failed });
      });
    } catch {
      process.send({ kind: "result", code: null, signal: null, failed: true });
    }
  } else if (
    message.kind === "signal" &&
    ["SIGINT", "SIGTERM", "SIGKILL"].includes(message.signal)
  ) {
    killGroup(message.signal);
  } else if (message.kind === "release") {
    process.exit(0);
  }
});
process.send({ kind: "ready" });
