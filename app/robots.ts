import type { MetadataRoute } from "next";

/**
 * Nothing here is private, and the redirected paths resolve to the same content
 * as `/`, so there is nothing to disallow.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://ericzheng.nz/sitemap.xml",
  };
}
