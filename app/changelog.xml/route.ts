import { changelog, changelogId } from "@/lib/changelog";
import { rss } from "@/lib/rss";

export const dynamic = "force-static";

export function GET() {
  return rss({
    title: "Eric Zheng — changelog",
    description: "Updates to Eric Zheng's personal website.",
    link: "/changelog",
    self: "/changelog.xml",
    items: changelog.map((entry) => ({
      title: entry.version,
      url: `/changelog#${changelogId(entry)}`,
      date: entry.date,
      description: entry.summary,
    })),
  });
}
