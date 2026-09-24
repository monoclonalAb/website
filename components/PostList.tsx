import Link from "next/link";
import { formatDate, type PostSummary } from "@/lib/content/posts";
import styles from "./Writing.module.css";

export default function PostList({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className={styles.list} aria-label="Writing">
      {posts.map((post) => (
        <li key={post.url}>
          <div className={styles.entryTitle}>
            <Link href={post.url}>
              {post.problemId ? `${post.problemId}. ` : ""}
              {post.title}
            </Link>
            {post.draft && (
              <strong className={styles.draft}>draft · local preview</strong>
            )}
          </div>
          <p className={styles.meta}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.difficulty && ` · ${post.difficulty}`}
            {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
          </p>
          {post.summary && <p>{post.summary}</p>}
        </li>
      ))}
    </ul>
  );
}
