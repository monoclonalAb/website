import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { codeToHast } from "shiki";
import type { Root as MarkdownRoot } from "mdast";
import type { Element, ElementContent, Root } from "hast";

export type Heading = { id: string; text: string; depth: number };

const text = (node: ElementContent): string =>
  node.type === "text"
    ? node.value
    : node.type === "element"
      ? node.children.map(text).join("")
      : "";

/**
 * Markdown is data, not code: raw HTML is rejected, and relative image paths
 * are served from `assetBase` (see app/writing-assets).
 */
export async function renderMarkdown(markdown: string, assetBase: string) {
  const headings: Heading[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(() => (tree: MarkdownRoot) => {
      visit(tree, (node) => {
        if (node.type === "html")
          throw new Error("Raw HTML isn't supported; use Markdown.");
        if (node.type === "heading" && node.depth === 1)
          throw new Error("Start headings at ##; the title is the h1.");
        if (node.type === "image" && !/^([a-z]+:|\/)/i.test(node.url))
          node.url = `${assetBase}/${node.url.replace(/^\.\//, "")}`;
      });
    })
    .use(remarkRehype)
    .use(() => async (tree: Root) => {
      const used = new Set(["top", "main"]);
      const code: Element[] = [];
      visit(tree, "element", (node, _, parent) => {
        if (/^h[2-6]$/.test(node.tagName)) {
          const label = text(node);
          const base =
            label
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]+/gu, "-")
              .replace(/^-|-$/g, "") || "section";
          let id = base;
          for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
          used.add(id);
          node.properties.id = id;
          headings.push({ id, text: label, depth: Number(node.tagName[1]) });
        }
        if (node.tagName === "pre") code.push(node);
        if (node.tagName === "img") node.properties.loading = "lazy";
        if (node.tagName === "table" && parent) {
          const wrapper: Element = {
            type: "element",
            tagName: "div",
            properties: { className: ["table-scroll"], tabIndex: 0 },
            children: [node],
          };
          parent.children[parent.children.indexOf(node)] = wrapper;
        }
      });
      for (const pre of code) {
        const inner = pre.children[0];
        if (inner?.type !== "element" || inner.tagName !== "code") continue;
        const classes = (inner.properties.className as string[]) ?? [];
        const lang =
          classes.find((c) => c.startsWith("language-"))?.slice(9) ?? "text";
        if (lang === "math") continue; // rendered by KaTeX
        const highlighted = await codeToHast(text(inner).replace(/\n$/, ""), {
          lang,
          theme: "github-light",
        });
        Object.assign(pre, highlighted.children[0]);
      }
    })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), headings };
}
