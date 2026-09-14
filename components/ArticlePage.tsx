import Link from "next/link";
import type { Metadata } from "next";
import ReadingPage from "./ReadingPage";
import { formatDate, description, type Post } from "@/lib/content/posts";
import { readingMetadata, OPEN_GRAPH_BASE } from "@/app/shared-metadata";
import styles from "./Writing.module.css";
import "katex/dist/katex.min.css";

export function articleMetadata(post: Post): Metadata {
  return {
    ...readingMetadata(post.title, post.url, description(post)),
    alternates: {
      canonical: post.url,
      types: { "application/rss+xml": "/writing.xml" },
    },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "article",
      title: post.title,
      description: description(post),
      url: post.url,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: ["Eric Zheng"],
      tags: post.tags,
    },
  };
}

export default function ArticlePage({ post }: { post: Post }) {
  const sections = post.headings.filter((heading) => heading.level === 2);
  return (
    <ReadingPage page={post.collection} id={post.identity}>
      <p className={styles.meta}>
        <Link href={`/${post.collection}`}>← {post.collection}</Link>
      </p>
      {post.draft && (
        <aside className={styles.draftNotice}>
          <strong>Draft — local preview only.</strong> Not included in
          production. This file is not private if committed to a public
          repository.
        </aside>
      )}
      <header className={styles.articleHeader}>
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
      {sections.length > 1 && (
        <details className={styles.outline}>
          <summary>On this page</summary>
          <ul>
            {sections.map((heading) => (
              <li key={heading.id}>
                <a href={`#${heading.id}`}>{heading.text}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
      {/* The non-executable Markdown pipeline rejects raw HTML and unsafe URLs. */}
      <article
        aria-label={post.title}
        className={styles.prose}
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </ReadingPage>
  );
}
