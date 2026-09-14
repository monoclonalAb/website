import { notFound } from "next/navigation";
import ArticlePage, { articleMetadata } from "@/components/ArticlePage";
import { writingCollection, writingPost } from "@/app/_content/writing";

// New files must preview without restarting next dev. Missing/draft production
// entries still fail the published-only lookup below; known posts are prerendered.
export const dynamicParams = true;
export async function generateStaticParams() {
  return (await writingCollection("blog")).map((post) => ({ slug: post.slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const post = await writingPost("blog", (await params).slug);
  if (!post) notFound();
  return articleMetadata(post);
}
export default async function Page({ params }: Props) {
  const post = await writingPost("blog", (await params).slug);
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
