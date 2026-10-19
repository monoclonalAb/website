import { getChangelog } from "@/lib/changelog";
import { rss } from "@/lib/rss";

export const dynamic = "force-static";

export async function GET() {
  const changelog = await getChangelog();
  return rss({
    title: "changelog by eric zheng",
    description: "updates to eric zheng's personal website",
    link: "/changelog",
    self: "/changelog.xml",
    items: changelog.map((entry) => ({
      title: entry.version,
      url: entry.url,
      // Where every entry used to be: newer entries push it to later pages,
      // and a new guid would show it again as unread.
      guid: `/changelog#${entry.id}`,
      date: entry.date,
      description: entry.text,
    })),
  });
}
