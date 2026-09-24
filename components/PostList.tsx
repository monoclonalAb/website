import Link from "next/link";
import { formatDate, type PostSummary } from "@/lib/content/posts";
import styles from "./EntryList.module.css";
import writingStyles from "./Writing.module.css";

export default function PostList({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className={styles.list} aria-label="Writing">
      {posts.map((post) => (
        <li key={post.url}>
          <time className={styles.date} dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          <div className={styles.body}>
            <h2 className={styles.title}>
              <Link href={post.url}>
                {post.problemId ? `${post.problemId}. ` : ""}
                {post.title}
              </Link>
            </h2>
            {post.draft && (
              <strong className={writingStyles.draft}>
                draft · local preview
              </strong>
            )}
            {(post.difficulty || post.tags.length > 0) && (
              <p className={styles.meta}>
                {[post.difficulty, post.tags.join(", ")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {post.summary && <p>{post.summary}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
