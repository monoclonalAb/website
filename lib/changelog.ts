import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderMarkdown } from "./markdown";

const file = path.join(process.cwd(), "content", "changelog.md");
const heading = /^(\d+\.\d+\.\d+) *\| *(\d{4}-\d{2}-\d{2})$/;

export type ChangelogEntry = {
  /** The permanent #changelog-<version> anchor and feed title; not shown. */
  version: string;
  date: string;
  html: string;
  /** Plain text for the feed: links keep only their words. */
  text: string;
};

/**
 * content/changelog.md, newest first: each entry is a `## 1.0.0 | 2025-01-09`
 * heading over a little Markdown. Shared by /changelog and /changelog.xml.
 */
export async function getChangelog() {
  const [preamble, ...blocks] = (await readFile(file, "utf8")).split(/^## /m);
  if (preamble.trim())
    fail('start with an entry, like "## 1.0.0 | 2025-01-09"');

  const entries: ChangelogEntry[] = [];
  for (const block of blocks) {
    const [title, ...lines] = block.split("\n");
    const match = heading.exec(title.trim());
    if (!match)
      fail(`"## ${title.trim()}" should look like "## 1.0.0 | 2025-01-09"`);
    const [, version, date] = match;
    const body = lines.join("\n").trim();
    const previous = entries.at(-1);
    if (!body) fail(`${version} has no text`);
    if (entries.some((entry) => entry.version === version))
      fail(`${version} appears twice`);
    if (previous && date > previous.date)
      fail(`${version} is newer than ${previous.version}; put it above`);
    const { html } = await renderMarkdown(body, "/writing-assets").catch(
      (error) => fail(`${version}: ${error.message}`),
    );
    entries.push({
      version,
      date,
      html,
      text: body.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " "),
    });
  }
  return entries;
}

function fail(message: string): never {
  throw new Error(`content/changelog.md: ${message}`);
}

export const changelogId = (entry: ChangelogEntry) =>
  `changelog-${entry.version.replaceAll(".", "-")}`;
