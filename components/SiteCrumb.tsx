"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OUTLINE_ROWS } from "@/app/scroll/outline";
import useOutlinePosition from "@/app/scroll/useOutlinePosition";
import styles from "./SiteCrumb.module.css";

/**
 * Where you are on the site, top-right, as a clickable file path: `ez / about.html_`.
 * `ez` returns to the site root; the filename returns to the start of the current file.
 *
 * There are no routes behind the home filenames — but the `contents` section already
 * calls its sections `/about.html`, so those links resolve to their real home fragments.
 *
 * The root stays visible beside the current file even when the larger rail is on screen,
 * so the crumb always reads—and works—like one complete path.
 */
export default function SiteCrumb() {
  // Always the home outline: off the home page the crumb names the route, not a row,
  // so the scanned outline (see SiteRail) has nothing to tell it.
  const { tile } = useOutlinePosition(OUTLINE_ROWS);
  const pathname = usePathname();

  // Off the home page there are no tiles to track and no rail to hand the root to — the
  // page is simply its own file, and `ez` is the only way back.
  const standalone = pathname !== "/";
  const leaf = standalone
    ? pathname.replace(/^\//, "").replace(/\/$/, "")
    : OUTLINE_ROWS.find((row) => row.id === tile)?.label.replace(/\.html$/, "");
  const leafHref = standalone ? pathname : `/#${tile ?? "top"}`;

  return (
    <nav
      className={styles.crumb}
      data-visible={standalone || (tile !== null && tile !== "top")}
      aria-label="Breadcrumb"
    >
      <span>
        <Link href="/#top" className={styles.link}>
          ez
        </Link>
        <span className={styles.sep}> / </span>
      </span>
      <Link href={leafHref} className={styles.link} aria-current="location">
        {leaf}
        <span className={styles.ext}>.html</span>
      </Link>
      <span className={styles.cursor} aria-hidden>
        _
      </span>
    </nav>
  );
}
