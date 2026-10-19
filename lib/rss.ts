import { SITE_URL } from "./metadata";

type Item = {
  title: string;
  url: string;
  /** What feed readers know the item by, if not its url, which can change. */
  guid?: string;
  date: string;
  description: string;
};

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );

type Feed = {
  title: string;
  description: string;
  /** The HTML page and the feed's own path. */
  link: string;
  self: string;
  items: Item[];
};

export function rss({ title, description, link, self, items }: Feed) {
  const body = items
    .map(
      (item) => `    <item>
      <title>${escape(item.title)}</title>
      <link>${escape(SITE_URL + item.url)}</link>
      <guid isPermaLink="${!item.guid}">${escape(SITE_URL + (item.guid ?? item.url))}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description>${escape(item.description)}</description>
    </item>`,
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(title)}</title>
    <link>${SITE_URL}${link}</link>
    <description>${escape(description)}</description>
    <language>en-NZ</language>
    <atom:link href="${SITE_URL}${self}" rel="self" type="application/rss+xml" />
${body}
  </channel>
</rss>
`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
