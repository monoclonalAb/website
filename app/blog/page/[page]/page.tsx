import type { Metadata } from "next";
import BlogIndex, { blogIndexMetadata } from "../../BlogIndex";
import { getPageCount } from "@/lib/posts";

type Props = { params: Promise<{ page: string }> };

// Only the pages listed below exist: /blog/page/1 and anything past the last
// page are unknown URLs, like /blog/nope.
export const dynamicParams = false;

export async function generateStaticParams() {
  const totalPages = await getPageCount("blog");
  return Array.from({ length: totalPages - 1 }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return blogIndexMetadata(Number(page));
}

export default async function BlogPageNumber({ params }: Props) {
  const { page } = await params;
  return <BlogIndex page={Number(page)} />;
}
