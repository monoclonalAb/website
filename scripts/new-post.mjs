#!/usr/bin/env node
import { scaffold } from "../lib/content/scaffold.ts";

const [collection, key, ...words] = process.argv.slice(2);
if (!key || !["blog", "leetcode"].includes(collection)) {
  console.error(
    "Usage: pnpm new:blog <slug> [title] | pnpm new:leetcode <YYYY-MM-DD> [title]",
  );
  process.exitCode = 1;
} else {
  try {
    const { file, url } = await scaffold(
      collection,
      key,
      words.length ? words.join(" ") : undefined,
    );
    console.log(
      `Created draft: ${file}\nPreview: http://localhost:3000${url}\nRun pnpm dev, then refresh after editing. Drafts are excluded from production.\nDraft files are NOT private if committed to a public repository.`,
    );
  } catch (error) {
    console.error(
      error.code === "EEXIST"
        ? "Entry already exists; nothing was overwritten."
        : error.message,
    );
    process.exitCode = 1;
  }
}
