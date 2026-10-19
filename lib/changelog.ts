import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { renderMarkdown } from "./markdown";
import { pageHref } from "./posts";

const file = path.join(process.cwd(), "content", "changelog.md");
const heading = /^(\d+\.\d+\.\d+) *\| *(\d{4}-\d{2}-\d{2})$/;
/** Entries per page of /changelog. */
const pageSize = 8;

export type ChangelogEntry = {
  /** The feed title; not shown. */
  version: string;
  /** The permanent anchor, changelog-<version>. */
  id: string;
  /** The anchor on the page the entry is on now; newer entries push it on. */
  url: string;
  date: string;
  html: string;
  /** Plain text for the feed: links keep only their words. */
  text: string;
};

/**
 * content/changelog.md, newest first: each entry is a `## 1.0.0 | 2025-01-09`
 * heading over a little Markdown. Shared by /changelog and /changelog.xml.
 */
export const getChangelog = cache(async () => {
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
    const id = `changelog-${version.replaceAll(".", "-")}`;
    const page = Math.floor(entries.length / pageSize) + 1;
    entries.push({
      version,
      id,
      url: `${pageHref("changelog", page)}#${id}`,
      date,
      html,
      text: body.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " "),
    });
  }
  return entries;
});

function fail(message: string): never {
  throw new Error(`content/changelog.md: ${message}`);
}

/** How many pages /changelog needs; at least one, even when empty. */
export const getChangelogPageCount = cache(async () =>
  Math.max(1, Math.ceil((await getChangelog()).length / pageSize)),
);

/** The entries on one page of /changelog, or undefined if the page number is out of range. */
export const getChangelogPage = cache(async (page: number) => {
  const totalPages = await getChangelogPageCount();
  if (!Number.isInteger(page) || page < 1 || page > totalPages)
    return undefined;
  const start = (page - 1) * pageSize;
  return {
    entries: (await getChangelog()).slice(start, start + pageSize),
    totalPages,
  };
});
