#!/usr/bin/env node
// pnpm docs:check: checks the agent docs (AGENTS.md, ARCHITECTURE.md, README.md,
// docs/ and .agents/skills/) against the repository, so they can't quietly go
// stale. Every failure says what to do about it.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(file, "utf8");
const problems = [];
const fail = (file, message) => problems.push(`${file}: ${message}`);

/** Tracked and new files, as a/b/c paths; ignored ones (node_modules, .next) are left out. */
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\n")
  .filter((file) => file && existsSync(file));
const folders = new Set(
  files.filter((file) => file.includes("/")).map((file) => file.split("/")[0]),
);
const docs = files.filter((file) =>
  /^((AGENTS|ARCHITECTURE|README)\.md|docs\/.+\.md|\.agents\/skills\/.+\.md)$/.test(
    file,
  ),
);

/** A doc's inline code, fenced code, and the link targets in its prose. */
function parse(doc) {
  const text = read(doc);
  const fences = text.match(/^(```|~~~)[^\n]*\n[\s\S]*?^\1/gm) ?? [];
  const prose = fences.reduce((rest, fence) => rest.replace(fence, ""), text);
  const spans = [...prose.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
  const links = [
    ...prose.replace(/`[^`\n]+`/g, "").matchAll(/\]\(([^)\s]+)\)/g),
  ].map((match) => match[1]);
  return { text, spans, fences, links };
}
const parsed = new Map(docs.map((doc) => [doc, parse(doc)]));

/** `app/{blog,leetcode}/[slug]` → every file it names; `<slug>` stands for any one folder or file name. */
function matcher(mention) {
  const expand = (pattern) => {
    const brace = /\{([^{}]*)\}/.exec(pattern);
    if (!brace) return [pattern];
    const [before, after] = [
      pattern.slice(0, brace.index),
      pattern.slice(brace.index + brace[0].length),
    ];
    return brace[1].split(",").flatMap((part) => expand(before + part + after));
  };
  const sources = expand(mention.replace(/\/$/, "")).map((pattern) =>
    pattern
      .split(/(<[^>]+>)/)
      .map((part) =>
        part.startsWith("<")
          ? "[^/]+"
          : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      )
      .join(""),
  );
  return new RegExp(`^(${sources.join("|")})(/|$)`);
}
/** Inline code that names something in the repository, like `lib/posts.ts`. */
const pathsIn = (spans) =>
  spans.filter((span) => !/\s/.test(span) && folders.has(span.split("/")[0]));

// 1. Every path a doc names exists. Plans come and go, and git keeps no empty
// folders, so docs/exec-plans/active/ may not exist. Completed plans are
// history: they may name files that have since gone.
for (const doc of docs.filter((doc) => !doc.includes("/completed/")))
  for (const mention of pathsIn(parsed.get(doc).spans))
    if (
      !mention.startsWith("docs/exec-plans/") &&
      !files.some((file) => matcher(mention).test(file))
    )
      fail(
        doc,
        `\`${mention}\` doesn't exist. Point it at where that code lives now, or delete the sentence if the thing is gone.`,
      );

// 2. Every relative link resolves.
for (const doc of docs)
  for (const link of parsed.get(doc).links) {
    if (/^([a-z]+:|#|\/)/i.test(link)) continue;
    const target = path.posix.join(path.posix.dirname(doc), link.split("#")[0]);
    if (!files.some((file) => file === target || file.startsWith(`${target}/`)))
      fail(doc, `the link to ${link} is broken. Fix it, or remove it.`);
  }

// 3. Every pnpm command a doc shows is a script.
const scripts = Object.keys(JSON.parse(read("package.json")).scripts);
const builtins = ["add", "dlx", "exec", "install", "remove", "run", "update"];
for (const doc of docs) {
  const { spans, fences } = parsed.get(doc);
  for (const [, name] of [...spans, ...fences]
    .join("\n")
    .matchAll(/\bpnpm ([a-z][\w:-]*)/g))
    if (!scripts.includes(name) && !builtins.includes(name))
      fail(
        doc,
        `\`pnpm ${name}\` isn't a script in package.json. Use the script's current name, or drop the command.`,
      );
}

// 4. ARCHITECTURE.md's code map covers every code file. Only the map counts:
// the prose says `lib/`, which would cover everything in it.
const codeMap = /^## Code map\n[\s\S]*?(?=^## |(?![\s\S]))/m.exec(
  parsed.get("ARCHITECTURE.md").text,
);
if (!codeMap) fail("ARCHITECTURE.md", 'put the code map under "## Code map".');
const mapped = pathsIn(
  [...(codeMap?.[0] ?? "").matchAll(/`([^`\n]+)`/g)].map((match) => match[1]),
).map(matcher);
for (const file of files.filter((file) =>
  /^(app|components|lib|scripts)\/.+\.(ts|tsx|mjs)$/.test(file),
))
  if (!mapped.some((pattern) => pattern.test(file)))
    fail(
      "ARCHITECTURE.md",
      `the code map doesn't cover \`${file}\`. Add it, or its folder, with a few words on what it does.`,
    );

// 5. Client components are the ones AGENTS.md allows.
const allowed = parsed.get("AGENTS.md").spans;
for (const file of files.filter((file) => /\.(ts|tsx)$/.test(file)))
  if (/^["']use client["'];?\s*$/m.test(read(file)) && !allowed.includes(file))
    fail(
      file,
      `is a client component, but AGENTS.md doesn't list it. Make it a Server Component (the default), or, if it can only work in the browser, move "use client" to the smallest component that needs it and add that file to the list in AGENTS.md.`,
    );

// 6. AGENTS.md stays a short map, and every doc can be reached from it.
const lines = parsed.get("AGENTS.md").text.trimEnd().split("\n").length;
if (lines > 100)
  fail(
    "AGENTS.md",
    `is ${lines} lines; keep it to 100 or fewer. It's a map: move the detail into ARCHITECTURE.md or docs/ and link to it.`,
  );
const reached = new Set(["AGENTS.md"]);
for (const doc of reached)
  for (const link of parsed.get(doc)?.links ?? []) {
    const target = path.posix.join(path.posix.dirname(doc), link.split("#")[0]);
    if (target.endsWith(".md") && parsed.has(target)) reached.add(target);
  }
for (const doc of docs.filter((doc) => doc.startsWith("docs/")))
  if (!reached.has(doc) && !/^docs\/exec-plans\/(active|completed)\//.test(doc))
    fail(
      doc,
      `can't be reached from AGENTS.md. Link it from AGENTS.md or a doc it links to, or delete it.`,
    );

// 7. Plans keep their record, and finished ones leave active/.
for (const plan of docs.filter((doc) =>
  /^docs\/exec-plans\/(active|completed)\//.test(doc),
)) {
  const { text } = parsed.get(plan);
  for (const section of ["Progress", "Decision log"])
    if (!new RegExp(`^## ${section}\\s*$`, "m").test(text))
      fail(plan, `add a "## ${section}" section (see docs/plans.md).`);
  const done = /^\s*- \[x\]/m.test(text);
  const open = /^\s*- \[ \]/m.test(text);
  if (plan.includes("/active/") && done && !open)
    fail(
      plan,
      "every step is ticked. Write the Outcome and move the plan to docs/exec-plans/completed/.",
    );
  if (plan.includes("/completed/") && !/^## Outcome\s*\n+[^#\s]/m.test(text))
    fail(
      plan,
      'a completed plan needs an "## Outcome": what shipped, what didn\'t, and why.',
    );
}

if (problems.length) {
  console.error(
    `The docs don't match the repository:\n\n${problems.map((problem) => `- ${problem}`).join("\n")}\n`,
  );
  process.exit(1);
}
console.log(`docs:check: ${docs.length} docs match the repository.`);
