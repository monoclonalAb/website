import type { Metadata } from "next";
import LeetcodeIndex, { leetcodeIndexMetadata } from "../../LeetcodeIndex";
import { getPageCount } from "@/lib/posts";

type Props = { params: Promise<{ page: string }> };

// Only the pages listed below exist: /leetcode/page/1 and anything past the
// last page are unknown URLs, like /leetcode/nope.
export const dynamicParams = false;

export async function generateStaticParams() {
  const totalPages = await getPageCount("leetcode");
  return Array.from({ length: totalPages - 1 }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return leetcodeIndexMetadata(Number(page));
}

export default async function LeetcodePageNumber({ params }: Props) {
  const { page } = await params;
  return <LeetcodeIndex page={Number(page)} />;
}
