import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parse } from "yaml";
import { z } from "zod";
import { renderMarkdown } from "./markdown";

export type Collection = "blog" | "leetcode";

const contentDir = path.join(process.cwd(), "content");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const frontmatter = z
  .object({
    title: z.string(),
    date,
    summary: z.string().optional(),
    problemId: z.number().optional(),
    problemUrl: z.url().optional(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  })
  .strict();

export type PostSummary = z.infer<typeof frontmatter> & {
  collection: Collection;
  slug: string;
  url: string;
};

/** Reads content/blog/<slug>/index.md or content/leetcode/<YYYY-MM-DD>.md */
async function readPost(collection: Collection, slug: string) {
  const file =
    collection === "blog"
      ? path.join(contentDir, "blog", slug, "index.md")
      : path.join(contentDir, "leetcode", `${slug}.md`);
  const source = await readFile(file, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  try {
    if (!match) throw new Error("Missing --- frontmatter ---");
    const post: PostSummary = {
      ...frontmatter.parse(parse(match[1])),
      collection,
      slug,
      url: `/${collection}/${slug}`,
    };
    return { post, body: source.slice(match[0].length) };
  } catch (error) {
    throw new Error(`${path.relative(process.cwd(), file)}: ${error}`);
  }
}

/** Newest first. */
export const getPosts = cache(
  async (collection: Collection): Promise<PostSummary[]> => {
    const entries = await readdir(path.join(contentDir, collection), {
      withFileTypes: true,
    });
    const slugs = entries.flatMap((entry) =>
      collection === "blog"
        ? entry.isDirectory()
          ? [entry.name]
          : []
        : entry.isFile() && entry.name.endsWith(".md")
          ? [entry.name.slice(0, -3)]
          : [],
    );
    const posts = await Promise.all(
      slugs.map(async (slug) => (await readPost(collection, slug)).post),
    );
    return posts.sort(
      (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
    );
  },
);

export const getPost = cache(async (collection: Collection, slug: string) => {
  if (!/^[\w-]+$/.test(slug)) return undefined;
  const found = await readPost(collection, slug).catch((error) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!found) return undefined;
  // Images sit next to the Markdown and are served by app/writing-assets.
  const assetBase =
    collection === "blog"
      ? `/writing-assets/blog/${slug}`
      : "/writing-assets/leetcode";
  return {
    ...found.post,
    ...(await renderMarkdown(found.body, assetBase)),
  };
});

export type Post = NonNullable<Awaited<ReturnType<typeof getPost>>>;

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const describe = (post: PostSummary) =>
  post.summary ??
  `${post.title} — ${post.collection === "blog" ? "writing" : "Leetcode notes"} by Eric Zheng.`;
