import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parse } from "yaml";
import { z } from "zod";
import { renderMarkdown, type Heading } from "./markdown";

const contentDir = path.join(process.cwd(), "content");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
/** Strict, so an unknown or misspelt key fails the build; `.extend()` keeps that. */
const common = z.strictObject({
  title: z.string(),
  date,
  summary: z.string().optional(),
});

type Section = {
  /**
   * "folder": content/<section>/<slug>/index.md, with images beside it.
   * "file": content/<section>/<slug>.md.
   */
  layout: "folder" | "file";
  /** Posts per index page. */
  pageSize: number;
  /** Frontmatter: `common`, or `common.extend({ ... })`. */
  schema: z.ZodObject;
};

/** Every section of posts. A new section is an entry here plus its pages in app/. */
const collections = {
  blog: { layout: "folder", pageSize: 8, schema: common },
  leetcode: {
    layout: "file",
    pageSize: 8,
    schema: common.extend({
      problemId: z.number(),
      problemUrl: z.url(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
    }),
  },
} satisfies Record<string, Section>;

export type Collection = keyof typeof collections;

/** A post's frontmatter plus where it lives. Narrow a mixed list with `post.collection`. */
export type PostSummary<C extends Collection = Collection> = {
  [K in C]: z.infer<(typeof collections)[K]["schema"]> & {
    collection: K;
    slug: string;
    url: string;
  };
}[C];

export type Post<C extends Collection = Collection> = PostSummary<C> & {
  html: string;
  headings: Heading[];
};

/** The Markdown file, and the URL its images are served from (see app/writing-assets). */
function locate(collection: Collection, slug: string) {
  return collections[collection].layout === "folder"
    ? {
        file: path.join(contentDir, collection, slug, "index.md"),
        assetBase: `/writing-assets/${collection}/${slug}`,
      }
    : {
        file: path.join(contentDir, collection, `${slug}.md`),
        assetBase: `/writing-assets/${collection}`,
      };
}

async function readPost<C extends Collection>(collection: C, slug: string) {
  const { file, assetBase } = locate(collection, slug);
  const source = await readFile(file, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  try {
    if (!match) throw new Error("Missing --- frontmatter ---");
    const schema: z.ZodObject = collections[collection].schema;
    // The schema just checked the fields; TypeScript can't link it back to C.
    const post = {
      ...schema.parse(parse(match[1])),
      collection,
      slug,
      url: `/${collection}/${slug}`,
    } as PostSummary<C>;
    return { post, body: source.slice(match[0].length), assetBase };
  } catch (error) {
    throw new Error(`${path.relative(process.cwd(), file)}: ${error}`);
  }
}

/** Newest first. */
export const getPosts = cache(
  async <C extends Collection>(collection: C): Promise<PostSummary<C>[]> => {
    const folder = collections[collection].layout === "folder";
    const entries = await readdir(path.join(contentDir, collection), {
      withFileTypes: true,
    });
    const slugs = entries.flatMap((entry) =>
      folder
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

/** Every index with pages: the post sections and the changelog. */
export type Paginated = Collection | "changelog";

/** Page 1 of an index is the collection root; later pages sit under /page/N. */
export const pageHref = (collection: Paginated, page: number) =>
  page === 1 ? `/${collection}` : `/${collection}/page/${page}`;

/**
 * Where the page-number field sends you without JavaScript: it submits ?page=N to
 * app/<collection>/page/route.ts. Anything below 2 or not a number opens page
 * 1; a page past the end 404s like any unknown URL, so no content is read here.
 */
export function jumpHref(collection: Paginated, request: Request) {
  const query = new URL(request.url).searchParams.get("page") ?? "";
  const page = Number.parseInt(query, 10);
  return pageHref(collection, page > 1 ? page : 1);
}

/** How many index pages a collection needs; at least one, even when empty. */
export const getPageCount = cache(async (collection: Collection) => {
  const posts = await getPosts(collection);
  return Math.max(
    1,
    Math.ceil(posts.length / collections[collection].pageSize),
  );
});

/** The posts on one index page, or undefined if the page number is out of range. */
export const getPostPage = cache(
  async <C extends Collection>(collection: C, page: number) => {
    const totalPages = await getPageCount(collection);
    if (!Number.isInteger(page) || page < 1 || page > totalPages)
      return undefined;
    const { pageSize } = collections[collection];
    const start = (page - 1) * pageSize;
    return {
      posts: (await getPosts(collection)).slice(start, start + pageSize),
      totalPages,
    };
  },
);

export const getPost = cache(
  async <C extends Collection>(
    collection: C,
    slug: string,
  ): Promise<Post<C> | undefined> => {
    if (!/^[\w-]+$/.test(slug)) return undefined;
    const found = await readPost(collection, slug).catch((error) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (!found) return undefined;
    return {
      ...found.post,
      ...(await renderMarkdown(found.body, found.assetBase)),
    };
  },
);

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const describe = (post: PostSummary) =>
  post.summary ?? `${post.title} — writing by eric zheng`;
