#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = resolve(ROOT, "docs");
const MAX_AGENT_LINES = 100;
const MAX_CURRENT_AGE_DAYS = 184;
const DAY = 24 * 60 * 60 * 1000;
const errors = [];

const required = [
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "docs/README.md",
  "docs/product.md",
  "docs/architecture.md",
  "docs/architecture/scroll-engine.md",
  "docs/design.md",
  "docs/development.md",
  "docs/testing.md",
  "docs/quality.md",
  "docs/debt.md",
  "docs/plans/README.md",
  "docs/plans/TEMPLATE.md",
  "docs/decisions/README.md",
  "docs/decisions/TEMPLATE.md",
];

const toPosix = (path) => path.split(sep).join("/");
const fromRoot = (path) => toPosix(relative(ROOT, path));
const read = (path) => readFileSync(path, "utf8");

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const file of required) {
  if (!existsSync(resolve(ROOT, file)))
    errors.push(`${file}: required file is missing`);
}

const agentPath = resolve(ROOT, "AGENTS.md");
if (existsSync(agentPath)) {
  const agentGuide = read(agentPath);
  const lineCount = agentGuide.trimEnd().split(/\r?\n/).length;
  const nextRule = [
    "<!-- BEGIN:nextjs-agent-rules -->",
    "# This is NOT the Next.js you know",
    "<!-- END:nextjs-agent-rules -->",
  ];
  for (const marker of nextRule) {
    if (!agentGuide.includes(marker)) {
      errors.push(
        `AGENTS.md: required Next.js agent-rule marker is missing: ${marker}`,
      );
    }
  }
  if (lineCount > MAX_AGENT_LINES) {
    errors.push(
      `AGENTS.md: ${lineCount} lines exceeds the ${MAX_AGENT_LINES}-line map limit; move detail into docs/`,
    );
  }
}

const claudePath = resolve(ROOT, "CLAUDE.md");
if (existsSync(claudePath)) {
  const normalized = read(claudePath).trim().replace(/\r\n/g, "\n");
  if (normalized !== "# CLAUDE.md\n\n@AGENTS.md") {
    errors.push(
      "CLAUDE.md: keep provider guidance as an @AGENTS.md compatibility import only",
    );
  }
}

const packagePath = resolve(ROOT, "package.json");
if (existsSync(packagePath)) {
  const pkg = JSON.parse(read(packagePath));
  for (const command of [
    "docs:check",
    "contracts:check",
    "format:check",
    "lint",
    "typecheck",
    "test:e2e",
    "build",
    "check",
    "validate",
  ]) {
    if (!pkg.scripts?.[command]) {
      errors.push(`package.json: documented command \`${command}\` is missing`);
    }
  }
}

const markdownFiles = [agentPath, resolve(ROOT, "README.md"), ...walk(DOCS)]
  .filter((path) => existsSync(path) && extname(path).toLowerCase() === ".md")
  .map((path) => resolve(path));
const docsFiles = markdownFiles.filter((path) =>
  path.startsWith(`${DOCS}${sep}`),
);
const template = (path) => /^template\.md$/i.test(path.split(sep).at(-1) ?? "");
const allowedStatuses = new Set([
  "current",
  "draft",
  "active",
  "accepted",
  "completed",
  "deprecated",
]);

function frontmatter(path, text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${fromRoot(path)}: missing frontmatter`);
    return null;
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+):\s*(.+?)\s*$/);
    if (field) fields[field[1]] = field[2].replace(/^['"]|['"]$/g, "");
  }

  for (const key of ["owner", "status", "last_verified"]) {
    if (!fields[key])
      errors.push(
        `${fromRoot(path)}: frontmatter field \`${key}\` is required`,
      );
  }
  if (fields.status && !allowedStatuses.has(fields.status)) {
    errors.push(`${fromRoot(path)}: unknown status \`${fields.status}\``);
  }

  if (fields.last_verified) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.last_verified)) {
      errors.push(`${fromRoot(path)}: last_verified must use YYYY-MM-DD`);
    } else {
      const verified = new Date(`${fields.last_verified}T00:00:00Z`);
      const now = new Date();
      if (Number.isNaN(verified.valueOf())) {
        errors.push(`${fromRoot(path)}: last_verified is not a real date`);
      } else if (verified.valueOf() > now.valueOf() + DAY) {
        errors.push(`${fromRoot(path)}: last_verified is in the future`);
      } else if (
        fields.status === "current" &&
        (now.valueOf() - verified.valueOf()) / DAY > MAX_CURRENT_AGE_DAYS
      ) {
        errors.push(
          `${fromRoot(path)}: current documentation is older than ${MAX_CURRENT_AGE_DAYS} days; review and restamp it`,
        );
      }
    }
  }

  return fields;
}

for (const path of docsFiles) {
  if (!template(path)) frontmatter(path, read(path));
}

for (const path of docsFiles) {
  const name = fromRoot(path);
  if (name.includes("/plans/active/") && !template(path)) {
    const status = frontmatter(path, read(path))?.status;
    if (status !== "active")
      errors.push(`${name}: plans in plans/active must have status active`);
  }
  if (name.includes("/plans/completed/") && !template(path)) {
    const status = frontmatter(path, read(path))?.status;
    if (status !== "completed") {
      errors.push(
        `${name}: plans in plans/completed must have status completed`,
      );
    }
  }
}

function stripFencedCode(text) {
  return text.replace(/^(\s*)(```|~~~)[\s\S]*?^\1\2\s*$/gm, "");
}

function resolveLocalLink(source, rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith("<") && target.endsWith(">"))
    target = target.slice(1, -1);
  else target = target.split(/\s+["']/)[0];

  if (
    !target ||
    target.startsWith("#") ||
    target.startsWith("/") ||
    /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(target)
  ) {
    return null;
  }

  const pathPart = target.split("#", 1)[0].split("?", 1)[0];
  if (!pathPart) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    errors.push(
      `${fromRoot(source)}: link has invalid URI encoding: ${target}`,
    );
    return null;
  }

  const candidate = resolve(dirname(source), decoded);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${sep}`)) {
    errors.push(`${fromRoot(source)}: link escapes the repository: ${target}`);
    return null;
  }

  const options = [
    candidate,
    `${candidate}.md`,
    resolve(candidate, "README.md"),
  ];
  const existing = options.find(
    (option) => existsSync(option) && statSync(option).isFile(),
  );
  if (!existing) {
    errors.push(`${fromRoot(source)}: broken local link \`${target}\``);
    return null;
  }
  return resolve(existing);
}

const graph = new Map(markdownFiles.map((path) => [path, new Set()]));
let localLinkCount = 0;
const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

for (const source of markdownFiles) {
  const text = stripFencedCode(read(source));
  for (const match of text.matchAll(linkPattern)) {
    const target = resolveLocalLink(source, match[1]);
    if (!target) continue;
    localLinkCount++;
    if (extname(target).toLowerCase() === ".md") graph.get(source)?.add(target);
  }
}

const roots = [agentPath, resolve(ROOT, "README.md")].filter(existsSync);
const reachable = new Set(roots);
const queue = [...roots];
while (queue.length) {
  const source = queue.shift();
  for (const target of graph.get(source) ?? []) {
    if (reachable.has(target)) continue;
    reachable.add(target);
    queue.push(target);
  }
}

for (const path of docsFiles) {
  if (!reachable.has(path)) {
    errors.push(
      `${fromRoot(path)}: orphaned knowledge file; link it from an indexed document`,
    );
  }
}

if (errors.length) {
  console.error(
    `docs:check failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`,
  );
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `docs:check passed (${docsFiles.length} knowledge files, ${localLinkCount} local links, AGENTS.md <= ${MAX_AGENT_LINES} lines)`,
);
