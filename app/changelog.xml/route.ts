import {
  CHANGELOG_ENTRIES,
  changelogEntryDate,
  changelogEntryPath,
} from "@/app/_content/changelog";

export const dynamic = "force-static";

const SITE_URL = "https://ericzheng.nz";
const CHANGELOG_URL = `${SITE_URL}/changelog`;
const FEED_URL = `${SITE_URL}/changelog.xml`;

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

function renderItems() {
  return CHANGELOG_ENTRIES.map((entry) => {
    const url = `${SITE_URL}${changelogEntryPath(entry)}`;

    return `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${changelogEntryDate(entry).toUTCString()}</pubDate>
      <description>${escapeXml(entry.summary)}</description>
    </item>`;
  }).join("\n");
}

export function GET() {
  const items = renderItems();
  const itemBlock = items ? `\n${items}` : "";

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Eric Zheng — changelog</title>
    <link>${CHANGELOG_URL}</link>
    <description>Updates to Eric Zheng&apos;s personal website.</description>
    <language>en-NZ</language>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />${itemBlock}
  </channel>
</rss>
`,
    {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    },
  );
}
