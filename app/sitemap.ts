import type { MetadataRoute } from "next";
import { publishedWriting } from "./_content/writing";

/**
 * Six canonical pages plus published writing. Retired studies, drafts,
 * fragment aliases and non-HTML feeds do not belong in the sitemap.
 *
 * `lastModified` is hardcoded to when each route's content actually changed
 * rather than `new Date()`, which would restamp on every build and tell crawlers
 * the page changed when nothing did.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await publishedWriting();
  return [
    {
      url: "https://ericzheng.nz",
      lastModified: new Date("2026-09-14"),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...["about", "blog", "contents", "changelog"].map((page) => ({
      url: `https://ericzheng.nz/${page}`,
      lastModified: new Date("2026-09-14"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: "https://ericzheng.nz/leetcode",
      lastModified: new Date("2026-09-14"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...posts.map((post) => ({
      url: `https://ericzheng.nz${post.url}`,
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
