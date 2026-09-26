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
      modifiedTime: post.updated ?? post.date,
      authors: ["Eric Zheng"],
      tags: post.tags,
    },
    robots: post.draft ? { index: false, follow: false } : undefined,
  };
}

export default function Article({ post }: { post: Post }) {
  const outline = post.headings.filter((heading) => heading.depth === 2);
  const { collection } = post;
  return (
    <ReadingPage current={collection}>
      <p className={styles.meta}>
        <Link href={`/${collection}`}>← {collection}</Link>
      </p>
      {post.draft && (
        <aside className={styles.draft}>
          <strong>Draft — local preview only.</strong> Not included in
          production. This file is not private if committed to a public
          repository.
        </aside>
      )}
      <header className={styles.header}>
        <h1>{post.title}</h1>
        <p className={styles.meta}>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.updated && (
            <>
              {" "}
              · updated{" "}
              <time dateTime={post.updated}>{formatDate(post.updated)}</time>
            </>
          )}
          {post.difficulty && ` · ${post.difficulty}`}
        </p>
        {post.problemUrl && (
          <p>
            <a href={post.problemUrl}>LeetCode problem {post.problemId}</a>
          </p>
        )}
        {post.tags.length > 0 && (
          <p className={styles.meta}>Topics: {post.tags.join(", ")}</p>
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
