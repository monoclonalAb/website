import { notFound } from "next/navigation";
import Article, { articleMetadata } from "@/components/Article";
import { getPost, getPosts } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPosts("leetcode")).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = await getPost("leetcode", (await params).slug);
  if (!post) notFound();
  return articleMetadata(post);
}

export default async function Page({ params }: Props) {
  const post = await getPost("leetcode", (await params).slug);
  if (!post) notFound();
  return <Article post={post} />;
}
