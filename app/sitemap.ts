import type { MetadataRoute } from "next";

/**
 * Six canonical, indexable HTML URLs. Retired studies, fragment aliases and
 * the non-HTML changelog feed do not belong in the sitemap.
 *
 * `lastModified` is hardcoded to when each route's content actually changed
 * rather than `new Date()`, which would restamp on every build and tell crawlers
 * the page changed when nothing did.
 */
export default function sitemap(): MetadataRoute.Sitemap {
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
      lastModified: new Date("2026-07-29"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
