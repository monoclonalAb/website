import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";
import { getPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = [...(await getPosts("blog")), ...(await getPosts("leetcode"))];
  return [
    ...["", "/about", "/blog", "/contents", "/changelog", "/leetcode"].map(
      (page) => ({ url: SITE_URL + page }),
    ),
    ...posts
      .filter((post) => !post.draft)
      .map((post) => ({
        url: SITE_URL + post.url,
        lastModified: post.updated ?? post.date,
      })),
  ];
}
