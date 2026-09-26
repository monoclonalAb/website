import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import styles from "@/components/entries.module.css";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getPosts } from "@/lib/posts";

export const metadata = pageMetadata(
  "Leetcode",
  "/leetcode",
  "Eric Zheng's solutions to the daily Leetcode question, grouped and posted as he works through them.",
);

export default async function LeetcodePage() {
  const posts = await getPosts("leetcode");
  return (
    <ReadingPage>
      <h1>
        leetcode<span>:</span>
      </h1>
      <p>
        for me to conveniently <b>group</b> and post my solutions to the daily
        leetcode question... hopefully I do not end up missing any... right...
      </p>
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <div>
              <h2>
                <Link href={post.url}>
                  {post.problemId && `${post.problemId}. `}
                  {post.title}
                </Link>
              </h2>
              {post.draft && (
                <p className={styles.meta}>draft · local preview</p>
              )}
              {post.difficulty && (
                <p className={styles.meta}>{post.difficulty}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </ReadingPage>
  );
}
