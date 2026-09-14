import { readFile, lstat } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP } from "unist-util-visit";
import { codeToHast, bundledLanguages } from "shiki";
import type { Root as MarkdownRoot } from "mdast";
import type { Root, Element } from "hast";

export const imageTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};
export type Asset = { path: string; file: string; type: string };
export type Heading = { id: string; text: string; level: number };

function safeLink(url: string) {
  return (
    !/[\u0000-\u0020\u007f\\]/.test(url) &&
    !url.startsWith("//") &&
    (!/^[a-z][a-z\d+.-]*:/i.test(url) || /^(https?:|mailto:)/i.test(url))
  );
}

/** Only ordinary local raster images. Never copy or serve Markdown/source/SVG. */
async function imageAsset(
  url: string,
  source: string,
  root: string,
): Promise<Asset> {
  if (
    !safeLink(url) ||
    /^[a-z][a-z\d+.-]*:/i.test(url) ||
    /[#?%]/.test(url) ||
    url.startsWith("/")
  )
    throw new Error(`Image must be a relative local file: ${url}`);
  const file = resolve(dirname(source), url);
  const path = relative(root, file).split(sep).join("/");
  const collection = relative(root, source).split(sep)[0];
  if (
    !path.startsWith(`${collection}/`) ||
    path.includes("../") ||
    !imageTypes[extname(file).toLowerCase()]
  )
    throw new Error(
      `Image must stay in its content collection and be PNG/JPEG/WebP/GIF/AVIF: ${url}`,
    );
  // Refuse symlinks at every level, not only at the final file.
  let current = root;
  for (const segment of path.split("/")) {
    current = resolve(current, segment);
    if ((await lstat(current)).isSymbolicLink())
      throw new Error(`Symlink image is not supported: ${url}`);
  }
  const stat = await lstat(file);
  if (!stat.isFile() || stat.size > 10 * 1024 * 1024)
    throw new Error(`Image must be a file under 10 MiB: ${url}`);
  return { path, file, type: imageTypes[extname(file).toLowerCase()] };
}

function textContent(node: Element): string {
  return node.children
    .map((child) =>
      child.type === "text"
        ? child.value
        : child.type === "element"
          ? textContent(child)
          : "",
    )
    .join("");
}

export async function renderMarkdown(
  body: string,
  source: string,
  root: string,
  identity: string,
) {
  const assets = new Map<string, Asset>();
  const headings: Heading[] = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(() => async (tree: MarkdownRoot) => {
      const images: Array<{ node: { url: string }; url: string }> = [];
      const imageLabels = new Set<string>();
      visit(tree, "imageReference", (node) => {
        imageLabels.add(node.identifier);
        if (!node.alt?.trim())
          throw new Error("Images need descriptive alt text");
      });
      visit(tree, (node) => {
        if (node.type === "html")
          throw new Error(
            "Raw HTML is not supported; use Markdown and shared styles",
          );
        if (node.type === "heading" && node.depth === 1)
          throw new Error(
            "Use ## headings; the frontmatter title supplies the page's only h1",
          );
        if (node.type === "text" && /(?:^|\n)\s*:::/.test(node.value))
          throw new Error(
            "Pandoc ::: blocks are not supported; use a Markdown blockquote",
          );
        if (
          node.type === "text" &&
          /\{(?:target\s*=|[#.][\w-])[^}]*\}/.test(node.value)
        )
          throw new Error(
            "Pandoc attributes are not supported; use ordinary Markdown links and headings",
          );
        if (node.type === "link" || node.type === "definition") {
          if (!safeLink(node.url))
            throw new Error(`Unsupported link URL: ${node.url}`);
        }
        if (node.type === "code" && (node.meta || node.lang?.startsWith("{")))
          throw new Error(
            "Use plain language fences such as ```cpp, without Pandoc attributes",
          );
        if (node.type === "image") {
          if (!node.alt?.trim())
            throw new Error("Images need descriptive alt text");
          images.push({ node, url: node.url });
        }
        if (node.type === "definition" && imageLabels.has(node.identifier))
          images.push({ node, url: node.url });
      });
      for (const { node, url } of images) {
        const asset = await imageAsset(url, source, root);
        assets.set(asset.path, asset);
        node.url = `/writing-assets/${asset.path.split("/").map(encodeURIComponent).join("/")}`;
      }
    })
    .use(remarkRehype, { clobberPrefix: `${identity}--fn-` })
    .use(() => async (tree: Root) => {
      const used = new Set<string>();
      const code: Array<{ node: Element; parent: Element }> = [];
      visit(tree, "element", (node, _index, parent) => {
        if (/^h[2-6]$/.test(node.tagName) && !node.properties.id) {
          const text = textContent(node);
          const base = `${identity}--${
            text
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]+/gu, "-")
              .replace(/^-|-$/g, "") || "section"
          }`;
          let id = base;
          for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
          used.add(id);
          node.properties.id = id;
          headings.push({ id, text, level: Number(node.tagName[1]) });
        }
        if (node.tagName === "pre" && parent?.type === "element") {
          node.properties.tabIndex = 0;
          node.properties["aria-label"] = "Code block";
        }
        if (
          node.tagName === "code" &&
          parent?.type === "element" &&
          parent.tagName === "pre"
        )
          code.push({ node, parent });
        if (node.tagName === "img") {
          node.properties.loading = "lazy";
          node.properties.decoding = "async";
        }
      });
      for (const { node, parent } of code) {
        const classes = node.properties.className as string[] | undefined;
        const lang =
          classes?.find((value) => value.startsWith("language-"))?.slice(9) ??
          "text";
        if (lang === "math") continue;
        if (
          lang !== "text" &&
          lang !== "txt" &&
          lang !== "plaintext" &&
          !Object.hasOwn(bundledLanguages, lang)
        )
          throw new Error(`Unknown code language: ${lang}`);
        const highlighted = await codeToHast(
          textContent(node).replace(/\n$/, ""),
          { lang, theme: "github-light" },
        );
        const pre = highlighted.children.find(
          (child): child is Element =>
            child.type === "element" && child.tagName === "pre",
        )!;
        parent.properties = {
          ...pre.properties,
          tabIndex: 0,
          "aria-label": `${lang} code`,
        };
        parent.children = pre.children;
      }
    })
    .use(rehypeKatex, {
      trust: false,
      strict: "error",
      output: "htmlAndMathml",
    })
    .use(() => (tree: Root) => {
      visit(tree, "element", (node, index, parent) => {
        if (node.tagName === "table" && parent && index !== undefined) {
          parent.children[index] = {
            type: "element",
            tagName: "div",
            properties: {
              className: ["table-scroll"],
              tabIndex: 0,
              role: "region",
              "aria-label": "Scrollable table",
            },
            children: [node],
          };
          return SKIP;
        }
        if (node.properties.id === "footnote-label")
          node.properties.id = `${identity}--footnote-label`;
        if (node.properties.ariaDescribedBy)
          node.properties.ariaDescribedBy = node.properties.ariaDescribedBy.map(
            (id) =>
              id === "footnote-label" ? `${identity}--footnote-label` : id,
          );
      });
    })
    .use(() => (tree: Root) => {
      const ids = new Set([identity, `${identity}-top`]);
      visit(tree, "element", (node) => {
        if (node.properties.id) ids.add(String(node.properties.id));
      });
      visit(tree, "element", (node) => {
        const href = node.properties.href;
        if (typeof href !== "string" || !href.startsWith("#")) return;
        const fragment = decodeURIComponent(href.slice(1));
        const target =
          fragment === "top"
            ? `${identity}-top`
            : ids.has(fragment)
              ? fragment
              : `${identity}--${fragment}`;
        if (!ids.has(target))
          throw new Error(`Unknown local heading fragment: ${href}`);
        node.properties.href = `#${target}`;
      });
    })
    .use(rehypeStringify);
  const file = await processor.process(body);
  if (file.messages.length)
    throw new Error(
      file.messages
        .map(
          (message) =>
            `${message.reason}${message.cause instanceof Error ? `: ${message.cause.message}` : ""}`,
        )
        .join("; "),
    );
  return { html: String(file), headings, assets: [...assets.values()] };
}

export async function readAsset(asset: Asset) {
  return readFile(asset.file);
}
