import { readdir, readFile, lstat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { parseDocument } from "yaml";
import { z } from "zod";
import type { renderMarkdown, Asset } from "./markdown.ts";

export type Collection = "blog" | "leetcode";
export const collections: Collection[] = ["blog", "leetcode"];
export const contentRoot = resolve(process.cwd(), "content");
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
const date = z.string().refine(isDate, "Use a real YYYY-MM-DD calendar date");
const metadataText = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\uFFFE\uFFFF]/u.test(value) &&
      value.isWellFormed(),
    "Metadata must be valid Unicode/XML text",
  );
const common = {
  title: metadataText.max(200),
  date,
  updated: date.optional(),
  summary: metadataText.max(400).optional(),
  draft: z.boolean(),
  tags: z
    .array(z.string().regex(slugPattern, "Use lowercase hyphenated tags"))
    .max(12)
    .default([]),
};
const blogSchema = z.object(common).strict();
const leetcodeSchema = z
  .object({
    ...common,
    problemId: z.number().int().positive().optional(),
    problemUrl: z
      .url()
      .refine(
        (value) =>
          /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/.test(value),
        "Use the canonical https://leetcode.com/problems/slug/ URL",
      )
      .optional(),
    difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.draft)
      for (const key of ["problemId", "problemUrl", "difficulty"] as const) {
        if (value[key] === undefined)
          context.addIssue({
            code: "custom",
            path: [key],
            message: "Required before publishing a Leetcode entry",
          });
      }
  });
export type PostMetadata = z.infer<typeof leetcodeSchema>;
export type PostSummary = PostMetadata & {
  collection: Collection;
  slug: string;
  url: string;
  identity: string;
};
type PostSource = PostSummary & { source: string; body: string };
export type Post = PostSource & {
  html: string;
  headings: Awaited<ReturnType<typeof renderMarkdown>>["headings"];
  assets: Awaited<ReturnType<typeof renderMarkdown>>["assets"];
};

export function parsePost(text: string, collection: Collection, slug: string) {
  if (!slugPattern.test(slug))
    throw new Error("Use a lowercase hyphenated URL filename/folder");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match)
    throw new Error("Start the file with YAML frontmatter between --- lines");
  const yaml = parseDocument(match[1], { schema: "core", uniqueKeys: true });
  if (yaml.errors.length || yaml.warnings.length)
    throw new Error(
      [...yaml.errors, ...yaml.warnings]
        .map((error) => error.message)
        .join("; "),
    );
  const metadata = (collection === "blog" ? blogSchema : leetcodeSchema).parse(
    yaml.toJS({ maxAliasCount: 0 }),
  ) as PostMetadata;
  if (metadata.updated && metadata.updated < metadata.date)
    throw new Error("updated cannot be earlier than date");
  if (new Set(metadata.tags).size !== metadata.tags.length)
    throw new Error("Duplicate tags");
  if (collection === "leetcode" && (!isDate(slug) || slug !== metadata.date))
    throw new Error(
      "Leetcode filename must be its frontmatter date (YYYY-MM-DD.md)",
    );
  const body = text.slice(match[0].length).trim();
  if (!body && !metadata.draft) throw new Error("Published posts need a body");
  return {
    ...metadata,
    body,
    collection,
    slug,
    url: `/${collection}/${slug}`,
    identity: `article-${collection}-${slug}`,
  };
}

async function files(directory: string): Promise<string[]> {
  const stat = await lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory())
    throw new Error(`Not a real content directory: ${directory}`);
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Symlinks are not supported: ${path}`);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (entry.name.endsWith(".md")) result.push(path);
  }
  return result.sort();
}

type LoadOptions = { root?: string; includeDrafts?: boolean };
type DiscoveryOptions = LoadOptions & { collection?: Collection };

function sourceError(root: string, source: string, error: unknown) {
  return new Error(
    `${relative(root, source)}: ${error instanceof Error ? error.message : "Invalid content"}`,
    { cause: error },
  );
}

async function realPath(path: string, directory: boolean) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink())
    throw new Error(`Symlinks are not supported: ${path}`);
  if (directory ? !stat.isDirectory() : !stat.isFile())
    throw new Error(
      `Not a real content ${directory ? "directory" : "file"}: ${path}`,
    );
}

async function readSource(
  source: string,
  collection: Collection,
  slug: string,
) {
  return {
    ...parsePost(await readFile(source, "utf8"), collection, slug),
    source,
  };
}

/** Fresh source discovery, without Markdown rendering or a process-global cache. */
async function loadSources({
  root = contentRoot,
  includeDrafts = false,
  collection: selected,
}: DiscoveryOptions = {}): Promise<PostSource[]> {
  await realPath(root, true);
  if (selected !== undefined && !collections.includes(selected))
    throw new Error("Unknown content collection");
  const posts: PostSource[] = [];
  for (const collection of selected ? [selected] : collections) {
    for (const source of await files(resolve(root, collection))) {
      const path = relative(resolve(root, collection), source)
        .split(sep)
        .join("/");
      try {
        if (
          collection === "blog"
            ? !/^[a-z0-9-]+\/index\.md$/.test(path)
            : !/^\d{4}-\d{2}-\d{2}\.md$/.test(path)
        )
          throw new Error(
            collection === "blog"
              ? "Use content/blog/<slug>/index.md"
              : "Use content/leetcode/YYYY-MM-DD.md",
          );
        const slug =
          collection === "blog" ? path.split("/")[0] : path.slice(0, -3);
        await realPath(source, false);
        const post = await readSource(source, collection, slug);
        if (includeDrafts || !post.draft) posts.push(post);
      } catch (error) {
        throw sourceError(root, source, error);
      }
    }
  }
  return posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url),
  );
}

/** Indexes, feeds, sitemap and static params receive no body/rendered payload. */
export async function loadPostSummaries(
  options: DiscoveryOptions = {},
): Promise<PostSummary[]> {
  return (await loadSources(options)).map(({ body, source, ...summary }) => {
    void body;
    void source;
    return summary;
  });
}

async function renderPost(post: PostSource, root: string): Promise<Post> {
  try {
    const { renderMarkdown } = await import("./markdown.ts");
    return {
      ...post,
      ...(await renderMarkdown(post.body, post.source, root, post.identity)),
    };
  } catch (error) {
    throw sourceError(root, post.source, error);
  }
}

/** Validate the route before touching disk; never scan/render unrelated articles. */
export async function loadPost(
  collection: Collection,
  slug: string,
  { root = contentRoot, includeDrafts = false }: LoadOptions = {},
): Promise<Post | undefined> {
  if (
    !collections.includes(collection) ||
    !slugPattern.test(slug) ||
    (collection === "leetcode" && !isDate(slug))
  )
    return undefined;
  await realPath(root, true);
  await realPath(resolve(root, collection), true);
  const source =
    collection === "blog"
      ? resolve(root, collection, slug, "index.md")
      : resolve(root, collection, `${slug}.md`);
  try {
    if (collection === "blog")
      await realPath(resolve(root, collection, slug), true);
    await realPath(source, false);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw sourceError(root, source, error);
  }
  let post: PostSource;
  try {
    post = await readSource(source, collection, slug);
  } catch (error) {
    throw sourceError(root, source, error);
  }
  if (!includeDrafts && post.draft) return undefined;
  return renderPost(post, root);
}

/** Referenced-image allowlist: parse Markdown references, never highlight or render maths. */
export async function loadWritingAssets(
  options: DiscoveryOptions = {},
): Promise<Asset[]> {
  const { collectMarkdownAssets } = await import("./markdown.ts");
  const assets = new Map<string, Asset>();
  for (const post of await loadSources(options)) {
    try {
      for (const asset of await collectMarkdownAssets(
        post.body,
        post.source,
        options.root ?? contentRoot,
      ))
        assets.set(asset.path, asset);
    } catch (error) {
      throw sourceError(options.root ?? contentRoot, post.source, error);
    }
  }
  return [...assets.values()];
}

/** Full corpus validation stays explicit in content:check/build, including drafts. */
export async function loadPosts(options: LoadOptions = {}): Promise<Post[]> {
  const posts: Post[] = [];
  for (const post of await loadSources(options))
    posts.push(await renderPost(post, options.root ?? contentRoot));
  return posts;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function description(post: PostSummary) {
  return (
    post.summary ??
    `${post.title} — ${post.collection === "blog" ? "writing" : "Leetcode notes"} by Eric Zheng.`
  );
}
