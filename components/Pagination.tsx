import Link from "next/link";
import { pageHref, type Collection } from "@/lib/posts";
import PageJump from "./PageJump";
import styles from "./Pagination.module.css";

/**
 * The row after an index's last entry: previous, the page number, next.
 * The page number is a field you can type a page into (see PageJump).
 * Renders nothing when the whole collection fits one page.
 */
export default function Pagination({
  collection,
  page,
  totalPages,
}: {
  collection: Collection;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <span className={styles.end}>
        {page > 1 ? (
          <Link href={pageHref(collection, page - 1)} rel="prev">
            <span aria-hidden="true">←&nbsp;</span>previous
          </Link>
        ) : (
          <span className={styles.inactive} aria-hidden="true">
            ←&nbsp;previous
          </span>
        )}
      </span>
      {/* A key per page, so the field starts empty again after a jump. */}
      <PageJump
        key={page}
        action={`/${collection}/page`}
        page={page}
        hrefs={Array.from({ length: totalPages }, (_, index) =>
          pageHref(collection, index + 1),
        )}
      />
      <span className={`${styles.end} ${styles.last}`}>
        {page < totalPages ? (
          <Link href={pageHref(collection, page + 1)} rel="next">
            next<span aria-hidden="true">&nbsp;→</span>
          </Link>
        ) : (
          <span className={styles.inactive} aria-hidden="true">
            next&nbsp;→
          </span>
        )}
      </span>
    </nav>
  );
}
