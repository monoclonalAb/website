import { execFile, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const image = "postgres:17-bookworm";

// Docker's explicit context takes precedence over DOCKER_HOST. Pin every
// subsequent command to this validated local socket, never a remote daemon.
export function localDockerEndpoint(env, contextEndpoint) {
  const endpoint = env.DOCKER_CONTEXT
    ? contextEndpoint
    : env.DOCKER_HOST || contextEndpoint;
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("BLOCKED: select a local Unix-socket Docker context.");
  }
  if (
    url.protocol !== "unix:" ||
    url.host ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith("/") ||
    url.pathname === "/"
  ) {
    throw new Error(
      "BLOCKED: only a local Unix-socket Docker daemon is allowed.",
    );
  }
  return endpoint;
}

async function main() {
  const controller = new AbortController();
  for (const [signal, code] of [
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ]) {
    process.once(signal, () => {
      process.exitCode = code;
      controller.abort();
    });
  }
  let contextEndpoint;
  if (process.env.DOCKER_CONTEXT || !process.env.DOCKER_HOST) {
    try {
      const args = [
        "context",
        "inspect",
        "--format",
        "{{.Endpoints.docker.Host}}",
      ];
      if (process.env.DOCKER_CONTEXT) args.push(process.env.DOCKER_CONTEXT);
      contextEndpoint = (
        await exec("docker", args, { timeout: 10_000 })
      ).stdout.trim();
    } catch {
      throw new Error(
        "BLOCKED: Docker CLI/local context unavailable; no container created.",
      );
    }
  }
  const endpoint = localDockerEndpoint(process.env, contextEndpoint);
  const dockerEnv = { ...process.env };
  for (const key of [
    "DOCKER_CONTEXT",
    "DOCKER_HOST",
    "DOCKER_TLS",
    "DOCKER_TLS_VERIFY",
    "DOCKER_CERT_PATH",
  ])
    delete dockerEnv[key];
  const docker = async (args, options = {}) => {
    try {
      return (
        await exec("docker", ["--host", endpoint, ...args], {
          env: dockerEnv,
          timeout: 30_000,
          signal: controller.signal,
          ...options,
        })
      ).stdout.trim();
    } catch {
      // Never surface raw command/env/SQL errors containing passwords or URLs.
      throw new Error(
        `Docker ${args[0]} failed or was interrupted; details redacted.`,
      );
    }
  };

  await docker(["version", "--format", "{{.Server.Version}}"]);
  console.log(`Preparing disposable ${image} (local Docker only).`);
  await docker(["pull", image], { timeout: 180_000 });
  const identity = await docker([
    "image",
    "inspect",
    image,
    "--format",
    "{{index .RepoDigests 0}}",
  ]);
  console.log(`Image: ${identity}`);

  const suffix = randomUUID().replaceAll("-", "");
  const name = `website-cms-test-${suffix}`;
  const database = `website_cms_test_${suffix}`;
  const user = "cms_test";
  const password = randomBytes(32).toString("hex");
  let container;
  try {
    container = await docker(
      [
        "create",
        "--name",
        name,
        "--label",
        "website.cms.disposable-test=true",
        "--label",
        `website.cms.test-run=${suffix}`,
        "--rm",
        "--publish",
        "127.0.0.1::5432",
        "--memory",
        "512m",
        "--cpus",
        "1",
        "--pids-limit",
        "256",
        "--tmpfs",
        "/var/lib/postgresql/data:rw,nosuid,size=256m",
        "--env",
        "POSTGRES_PASSWORD",
        "--env",
        `POSTGRES_DB=${database}`,
        "--env",
        "POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256",
        identity,
      ],
      {
        env: {
          ...dockerEnv,
          POSTGRES_PASSWORD: randomBytes(32).toString("hex"),
        },
      },
    );
    await docker(["start", container]);
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        await docker([
          "exec",
          container,
          "pg_isready",
          "-h",
          "127.0.0.1",
          "-U",
          "postgres",
          "-d",
          database,
        ]);
        ready = true;
        break;
      } catch {
        await delay(500, undefined, { signal: controller.signal });
      }
    }
    if (!ready)
      throw new Error("BLOCKED: disposable PostgreSQL did not become ready.");
    // The bootstrap superuser is never the integration-test role. SQL/passwords
    // travel over stdin, not CLI arguments, files, chat or terminal output.
    await new Promise((resolve, reject) => {
      const child = spawn(
        "docker",
        [
          "--host",
          endpoint,
          "exec",
          "-i",
          container,
          "psql",
          "-X",
          "--no-password",
          "--set=ON_ERROR_STOP=1",
          "-U",
          "postgres",
          "-d",
          "postgres",
        ],
        {
          env: dockerEnv,
          stdio: ["pipe", "ignore", "ignore"],
          timeout: 30_000,
          signal: controller.signal,
        },
      );
      child.on("error", () =>
        reject(new Error("Test-role bootstrap failed; details redacted.")),
      );
      child.stdin.on("error", () => {});
      child.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error("Test-role bootstrap failed; details redacted.")),
      );
      child.stdin.end(
        `CREATE ROLE ${user} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${password}';\nALTER DATABASE ${database} OWNER TO ${user};\n`,
      );
    });
    const binding = await docker(["port", container, "5432/tcp"]);
    const port = /^127\.0\.0\.1:(\d+)$/.exec(binding)?.[1];
    if (!port) throw new Error("Refusing unexpected Docker port binding.");
    const version = await docker([
      "exec",
      container,
      "psql",
      "-XAt",
      "-U",
      "postgres",
      "-d",
      database,
      "-c",
      "SHOW server_version",
    ]);
    console.log(
      `PostgreSQL ${version}; fresh tmpfs database, loopback-only port, non-superuser test role.`,
    );
    const env = {
      ...process.env,
      CMS_TEST_DATABASE_URL: `postgresql://${user}:${password}@127.0.0.1:${port}/${database}`,
      CMS_TEST_DATABASE_CONFIRM: database,
    };
    delete env.DATABASE_URL;
    for (const phase of ["fresh migration", "existing migration replay"]) {
      console.log(`CMS integration: ${phase}`);
      await new Promise((resolve, reject) => {
        const child = spawn("pnpm", ["test:cms:db"], {
          cwd: root,
          env,
          stdio: "inherit",
          timeout: 120_000,
          signal: controller.signal,
        });
        child.on("error", () =>
          reject(
            new Error("CMS integration runner failed or was interrupted."),
          ),
        );
        child.on("close", (code) =>
          code === 0
            ? resolve()
            : reject(
                new Error(
                  "CMS integration tests failed; see assertions above.",
                ),
              ),
        );
      });
    }
  } finally {
    // Also find a container whose create response was lost/interrupted. Scope
    // cleanup to this unpredictable run label, never a broad name/prefix prune.
    try {
      const ids = await docker(
        [
          "container",
          "ls",
          "--all",
          "--filter",
          `label=website.cms.test-run=${suffix}`,
          "--format",
          "{{.ID}}",
        ],
        { signal: undefined },
      );
      for (const id of ids.split(/\s+/).filter(Boolean)) {
        if (!/^[a-f0-9]{12,64}$/.test(id))
          throw new Error("Invalid container identity.");
        await docker(["rm", "--force", "--volumes", id], { signal: undefined });
      }
      console.log(
        "Disposable test cleanup complete; no test container or persistent database volume retained.",
      );
    } catch {
      throw new Error(
        `Cleanup could not be confirmed. Inspect only container ${name} (label website.cms.test-run=${suffix}); do not prune other resources.`,
      );
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode ||= 1;
  });
}
