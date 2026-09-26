import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import styles from "@/components/entries.module.css";
import { pageMetadata } from "@/lib/metadata";
import { formatDate, getPosts } from "@/lib/posts";

export const metadata = pageMetadata(
  "Blog",
  "/blog",
  "A place for Eric Zheng's thoughts on interesting topics.",
);

export default async function BlogPage() {
  const posts = await getPosts("blog");
  return (
    <ReadingPage current="blog">
      <h1>
        blog<span>:</span>
      </h1>
      <p>
        place for me to put my thoughts on <b>interesting topics</b>! (group
        theory)
      </p>
      <p>
        also if there is not enough writing for you to read (probably
        isn&apos;t), please look at this <Link href="/leetcode">leetcode</Link>{" "}
        page instead...
      </p>
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.slug}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <div>
              <h2>
                <Link href={post.url}>{post.title}</Link>
              </h2>
              {post.draft && (
                <p className={styles.meta}>draft · local preview</p>
              )}
              {post.summary && <p>{post.summary}</p>}
            </div>
          </li>
        ))}
      </ul>
    </ReadingPage>
  );
}
