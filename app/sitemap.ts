import type { MetadataRoute } from "next";

/**
 * Two canonical, indexable URLs. The unlisted `/test` dial playground is deliberately
 * `noindex`, so it does not belong here.
 *
 * The four sections (#about, #blog, #contents, #changelog) are fragments of `/`,
 * not URLs — crawlers discard the hash, so listing them would just repeat `/`.
 * The old `/about`, `/blog`, `/contents` and `/changelog` paths are 308s
 * (next.config.ts) and must stay out: a redirect in a sitemap is a Search
 * Console error, not a hint.
 *
 * `lastModified` is hardcoded to when each route's content actually changed
 * rather than `new Date()`, which would restamp on every build and tell crawlers
 * the page changed when nothing did.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ericzheng.nz",
      lastModified: new Date("2026-07-31"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://ericzheng.nz/leetcode",
      lastModified: new Date("2026-07-29"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
