import "server-only";
import { cache } from "react";
import { loadPosts, type Collection } from "../../lib/content/posts";

// React cache shares metadata/body within one render, not stale content across dev refreshes.
export const writing = cache(() =>
  loadPosts({ includeDrafts: process.env.NODE_ENV === "development" }),
);
export const publishedWriting = cache(() => loadPosts());
export async function writingCollection(collection: Collection) {
  return (await writing()).filter((post) => post.collection === collection);
}
export async function writingPost(collection: Collection, slug: string) {
  return (await writingCollection(collection)).find(
    (post) => post.slug === slug,
  );
}
