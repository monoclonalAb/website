import Link from "next/link";
import styles from "./SiteHeader.module.css";

export type ReadingPageId =
  "about" | "blog" | "contents" | "changelog" | "leetcode";

export default function SiteHeader({
  currentPage,
}: {
  currentPage: ReadingPageId;
}) {
  return (
    <header className={styles.header}>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Isolate legacy home IDs from Next's retained reading DOM. */}
      <a href="/" className={styles.logo} aria-label="Eric Zheng — home">
        ez<span>._</span>
      </a>
      <nav aria-label="Site navigation" className={styles.navigation}>
        <Link
          href="/about"
          aria-current={currentPage === "about" ? "page" : undefined}
        >
          about
        </Link>
        <span aria-hidden="true">~</span>
        <Link
          href="/blog"
          aria-current={currentPage === "blog" ? "page" : undefined}
        >
          blog
        </Link>
        <span aria-hidden="true">~</span>
        <Link
          href="/contents"
          aria-current={currentPage === "contents" ? "page" : undefined}
        >
          contents
        </Link>
        <span aria-hidden="true">~</span>
        <Link
          href="/changelog"
          aria-current={currentPage === "changelog" ? "page" : undefined}
        >
          changelog
        </Link>
      </nav>
    </header>
  );
}
