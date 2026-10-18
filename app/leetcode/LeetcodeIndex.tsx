import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Pagination from "@/components/Pagination";
import ReadingPage from "@/components/ReadingPage";
import styles from "@/components/entries.module.css";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getPostPage, pageHref } from "@/lib/posts";

/** /leetcode and every /leetcode/page/[page] share this page. */
export default async function LeetcodeIndex({ page }: { page: number }) {
  const result = await getPostPage("leetcode", page);
  if (!result) notFound();
  return (
    <ReadingPage>
      <h1>
        leetcode<span>:</span>
      </h1>
      <p>
        where i used to <b>group</b> and post my solutions to the daily leetcode
        question...
      </p>
      <ul className={styles.list}>
        {result.posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <div>
              <h2>
                <Link href={post.url}>
                  {`${post.problemId}. `}
                  {post.title}
                </Link>
              </h2>
              <p className={styles.summary}>{post.difficulty}</p>
            </div>
          </li>
        ))}
      </ul>
      <Pagination
        collection="leetcode"
        page={page}
        totalPages={result.totalPages}
      />
    </ReadingPage>
  );
}

export const leetcodeIndexMetadata = (page: number): Metadata =>
  pageMetadata(
    page === 1 ? "Leetcode" : `Leetcode, page ${page}`,
    pageHref("leetcode", page),
    "an archive of eric zheng's solutions to the daily leetcode question",
  );
