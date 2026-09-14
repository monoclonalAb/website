import { mkdir, writeFile, lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify } from "yaml";
import {
  contentRoot,
  isDate,
  slugPattern,
  parsePost,
  type Collection,
} from "./posts.ts";

/** wx never overwrites an existing entry, including a symlink at the target. */
export async function scaffold(
  collection: Collection,
  key: string,
  title?: string,
  root = contentRoot,
) {
  if (collection !== "blog" && collection !== "leetcode")
    throw new Error("Choose blog or leetcode");
  if (collection === "blog" ? !slugPattern.test(key) : !isDate(key))
    throw new Error(
      collection === "blog"
        ? "Use a lowercase-hyphenated slug"
        : "Use a real YYYY-MM-DD date",
    );
  const folder =
    collection === "blog"
      ? resolve(root, collection, key)
      : resolve(root, collection);
  const file = resolve(
    folder,
    collection === "blog" ? "index.md" : `${key}.md`,
  );
  await mkdir(root, { recursive: true });
  for (const directory of [
    root,
    resolve(root, collection),
    ...(collection === "blog" ? [folder] : []),
  ]) {
    await mkdir(directory, { recursive: true });
    const stat = await lstat(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error("Content directories must not be symlinks");
  }
  const date =
    collection === "leetcode"
      ? key
      : new Intl.DateTimeFormat("en-CA").format(new Date());
  const metadata = stringify({
    title:
      title ??
      (collection === "blog"
        ? key.replaceAll("-", " ")
        : `Leetcode notes — ${key}`),
    date,
    draft: true,
    tags: [],
  });
  const problem =
    collection === "leetcode"
      ? "# Fill these in before publishing:\n# problemId: 1\n# problemUrl: https://leetcode.com/problems/two-sum/\n# difficulty: Easy\n"
      : "# Optional: summary, updated (YYYY-MM-DD)\n";
  const body =
    collection === "blog"
      ? "## Introduction\n\nStart writing here.\n"
      : "## Approach\n\nExplain the idea here.\n\n## Solution\n\n```cpp\n// Your solution\n```\n\n## Complexity\n\n- Time: …\n- Space: …\n\n## What I learned\n\n…\n";
  const text = `---\n${metadata}${problem}---\n\n${body}`;
  parsePost(text, collection, key);
  await writeFile(file, text, { flag: "wx" });
  return { file, url: `/${collection}/${key}` };
}
