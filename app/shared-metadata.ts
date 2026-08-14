import type { Metadata } from "next";

/**
 * Metadata fields that are true of every route.
 *
 * These live here because Next **replaces** nested metadata objects rather than
 * deep-merging them: a page that sets `openGraph` at all drops every openGraph
 * field the root layout declared, and likewise for `twitter`. See "Overwriting
 * fields" in
 * `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
 * — pulling the shared fields into a variable and spreading them back in is the
 * pattern those docs prescribe for exactly this.
 *
 * So: anything invariant across routes belongs in here, not in a route. A route
 * should only ever set what actually differs between routes — `url`, `title`,
 * `description`.
 *
 * `satisfies` rather than `as const`: both keep the string literals narrow
 * enough for the OpenGraph union, but `as const` also freezes `images` readonly,
 * which `OGImage[]` will not accept.
 */

export const OPEN_GRAPH_BASE = {
  type: "website",
  siteName: "Eric Zheng",
  // Underscore, not the hyphen <html lang> uses — og:locale is POSIX-shaped.
  locale: "en_NZ",
  images: [
    {
      // app/opengraph-image.jpg is a file convention, and the root layout gets
      // og:image from it for free — but *only* the root. A route that declares
      // `openGraph` replaces the whole object, file-derived images included, so
      // /leetcode rendered with no og:image at all until this was stated here.
      // Next dedupes it against the file convention rather than emitting twice.
      url: "/opengraph-image.jpg",
      width: 1200,
      height: 630,
      alt: "Eric Zheng, photographed through a doorway at Parable House",
    },
  ],
} satisfies Metadata["openGraph"];

export const TWITTER_BASE = {
  // With no twitter-image file, X falls back to og:image — a second copy of the
  // same photo would only add weight.
  card: "summary_large_image",
} satisfies Metadata["twitter"];
