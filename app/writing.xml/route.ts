import { describe, getPosts } from "@/lib/posts";
import { rss } from "@/lib/rss";

export const dynamic = "force-static";

export async function GET() {
  const posts = [
    ...(await getPosts("blog")),
    ...(await getPosts("leetcode")),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return rss({
    title: "writing by eric zheng",
    description: "writing by eric zheng",
    link: "/blog",
    self: "/writing.xml",
    items: posts.map((post) => ({ ...post, description: describe(post) })),
  });
}
