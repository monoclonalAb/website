#!/usr/bin/env node
// pnpm new:blog <slug> [title]  |  pnpm new:leetcode <YYYY-MM-DD> [title]
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [collection, key = "", ...words] = process.argv.slice(2);
const valid =
  collection === "blog"
    ? /^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)
    : /^\d{4}-\d{2}-\d{2}$/.test(key);

if (!valid) {
  console.error(
    collection === "blog"
      ? "Usage: pnpm new:blog <lowercase-hyphenated-slug> [title]"
      : "Usage: pnpm new:leetcode <YYYY-MM-DD> [title]",
  );
  process.exit(1);
}

const blog = collection === "blog";
const file = blog
  ? `content/blog/${key}/index.md`
  : `content/leetcode/${key}.md`;
const title = words.join(" ") || (blog ? key.replaceAll("-", " ") : key);
const frontmatter = [
  `title: ${JSON.stringify(title)}`,
  `date: ${blog ? new Date().toLocaleDateString("en-CA") : key}`,
  "draft: true",
  ...(blog
    ? ["# summary: one line for the blog index and RSS"]
    : [
        "# problemId: 1",
        "# problemUrl: https://leetcode.com/problems/two-sum/",
        "# difficulty: Easy",
      ]),
];
const body = blog ? "## introduction\n\n" : "## code\n\n```cpp\n\n```\n";

await mkdir(dirname(file), { recursive: true });
try {
  await writeFile(file, `---\n${frontmatter.join("\n")}\n---\n\n${body}`, {
    flag: "wx",
  });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.error(`${file} already exists.`);
  process.exit(1);
}
console.log(`Created ${file}
Preview: pnpm dev, then open http://localhost:3000/${collection}/${key}
Set draft: false when it's ready to publish.`);
