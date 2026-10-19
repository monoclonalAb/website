import type { Metadata } from "next";

export const SITE_URL = "https://ericzheng.nz";

// Next replaces (rather than merges) nested metadata objects, so pages that set
// `openGraph` must repeat these shared fields.
export const openGraph = {
  type: "website",
  siteName: "Eric Zheng",
  locale: "en_NZ",
  images: [
    {
      url: "/opengraph-image.jpg",
      width: 1200,
      height: 630,
      alt: "The home page: the split alphabet, with ERIC and ZHENG in red and about, blog, contents and changelog in white on the dark half",
    },
  ],
} satisfies Metadata["openGraph"];

export const feeds = {
  "application/rss+xml": [
    { url: "/changelog.xml", title: "changelog by eric zheng" },
  ],
};

export function pageMetadata(
  title: string,
  path: string,
  description: string,
): Metadata {
  const fullTitle = `${title} | Eric Zheng`;
  return {
    title,
    description,
    alternates: { canonical: path, types: feeds },
    openGraph: { ...openGraph, url: path, title: fullTitle, description },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}
