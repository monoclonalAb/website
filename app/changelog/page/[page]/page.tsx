import type { Metadata } from "next";
import ChangelogIndex, { changelogIndexMetadata } from "../../ChangelogIndex";
import { getChangelogPageCount } from "@/lib/changelog";

type Props = { params: Promise<{ page: string }> };

// Only the pages listed below exist: /changelog/page/1 and anything past the
// last page are unknown URLs, like /changelog/nope.
export const dynamicParams = false;

export async function generateStaticParams() {
  const totalPages = await getChangelogPageCount();
  return Array.from({ length: totalPages - 1 }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return changelogIndexMetadata(Number(page));
}

export default async function ChangelogPageNumber({ params }: Props) {
  const { page } = await params;
  return <ChangelogIndex page={Number(page)} />;
}
