import { description, type Post } from "./posts.ts";
export const siteUrl = "https://ericzheng.nz";
export function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
}
export function writingFeed(posts: Post[]) {
  const items = posts
    .filter((post) => !post.draft)
    .map((post) => {
      const url = `${siteUrl}${post.url}`;
      return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(post.date).toUTCString()}</pubDate><description>${escapeXml(description(post))}</description><category>${post.collection}</category></item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Eric Zheng — writing</title><link>${siteUrl}/blog</link>
<description>Blog posts and Leetcode notes by Eric Zheng.</description><language>en-NZ</language>
<atom:link href="${siteUrl}/writing.xml" rel="self" type="application/rss+xml" />
${items}
</channel></rss>\n`;
}
