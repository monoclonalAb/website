import { notFound } from "next/navigation";
import ArticlePage, { articleMetadata } from "@/components/ArticlePage";
import { writingCollection, writingPost } from "@/app/_content/writing";

// Allow newly scaffolded files during dev; production lookup excludes drafts.
export const dynamicParams = true;
export async function generateStaticParams() {
  return (await writingCollection("leetcode")).map((post) => ({
    slug: post.slug,
  }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const post = await writingPost("leetcode", (await params).slug);
  if (!post) notFound();
  return articleMetadata(post);
}
export default async function Page({ params }: Props) {
  const post = await writingPost("leetcode", (await params).slug);
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
