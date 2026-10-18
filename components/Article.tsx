import type { Metadata } from "next";
import Link from "next/link";
import ReadingPage from "./ReadingPage";
import { openGraph, pageMetadata } from "@/lib/metadata";
import { describe, formatDate, type Post } from "@/lib/posts";
import styles from "./Article.module.css";
import "katex/dist/katex.min.css";

export function articleMetadata(post: Post): Metadata {
  const description = describe(post);
  return {
    ...pageMetadata(post.title, post.url, description),
    openGraph: {
      ...openGraph,
      type: "article",
      url: post.url,
      title: post.title,
      description,
      publishedTime: post.date,
      authors: ["Eric Zheng"],
    },
  };
}

export default function Article({ post }: { post: Post }) {
  const outline = post.headings.filter((heading) => heading.depth === 2);
  const { collection } = post;
  const problem = post.collection === "leetcode" ? post : undefined;
  return (
    <ReadingPage current={collection}>
      <p className={styles.meta}>
        <Link href={`/${collection}`}>← {collection}</Link>
      </p>
      <header className={styles.header}>
        <h1>{post.title}</h1>
        <p className={styles.meta}>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {problem && ` · ${problem.difficulty}`}
        </p>
        {problem && (
          <p>
            <a href={problem.problemUrl}>
              LeetCode problem {problem.problemId}
            </a>
          </p>
        )}
      </header>
      {outline.length > 1 && (
        <details className={styles.outline}>
          <summary>On this page</summary>
          <ul>
            {outline.map((heading) => (
              <li key={heading.id}>
                <a href={`#${heading.id}`}>{heading.text}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
      <article
        className={styles.prose}
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </ReadingPage>
  );
}
