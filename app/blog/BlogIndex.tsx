import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Pagination from "@/components/Pagination";
import ReadingPage from "@/components/ReadingPage";
import styles from "@/components/entries.module.css";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getPostPage, pageHref } from "@/lib/posts";

/** /blog and every /blog/page/[page] share this page; only the posts differ. */
export default async function BlogIndex({ page }: { page: number }) {
  const result = await getPostPage("blog", page);
  if (!result) notFound();
  return (
    <ReadingPage current="blog">
      <h1>
        blog<span>:</span>
      </h1>
      <p>
        a place for me to write about whatever catches my interests! i&apos;m
        aiming for something &quot;semi-academic&quot; but do not expect any
        form of consistency with the topics chosen-
      </p>
      <ul className={styles.list}>
        {result.posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <div>
              <h2>
                <Link href={post.url}>{post.title}</Link>
              </h2>
              {post.summary && <p className={styles.summary}>{post.summary}</p>}
            </div>
          </li>
        ))}
      </ul>
      <Pagination
        collection="blog"
        page={page}
        totalPages={result.totalPages}
      />
    </ReadingPage>
  );
}

export const blogIndexMetadata = (page: number): Metadata =>
  pageMetadata(
    page === 1 ? "Blog" : `Blog, page ${page}`,
    pageHref("blog", page),
    "a place for eric zheng's thoughts on interesting topics",
  );
