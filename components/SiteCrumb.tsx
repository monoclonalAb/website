"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OUTLINE_ROWS } from "@/app/scroll/outline";
import useOutlinePosition from "@/app/scroll/useOutlinePosition";
import styles from "./SiteCrumb.module.css";

/**
 * Where you are on the site, top-right, as a pseudo-filename: `ez / about.html_`.
 *
 * There are no routes behind those names — but the `contents` section already calls the
 * site's own sections `/about.html`, so this is the site's fiction rather than a new one.
 *
 * The `ez /` prefix is conditional: the rail owns the root wherever its words are on
 * screen, and the crumb takes it back wherever they are not. That decision is made
 * entirely in the stylesheet, so neither component has to reach into the other.
 */
export default function SiteCrumb() {
  const { tile } = useOutlinePosition();
  const pathname = usePathname();

  // Off the home page there are no tiles to track and no rail to hand the root to — the
  // page is simply its own file, and `ez` is the only way back.
  const standalone = pathname !== "/";
  const leaf = standalone
    ? pathname.replace(/^\//, "").replace(/\/$/, "")
    : OUTLINE_ROWS.find((row) => row.id === tile)?.label.replace(/\.html$/, "");

  return (
    <div
      className={styles.crumb}
      data-visible={standalone || (tile !== null && tile !== "top")}
      data-rail={!standalone}
    >
      <span className={styles.prefix}>
        <Link href="/#top" className={styles.home}>
          ez
        </Link>
        <span className={styles.sep}> / </span>
      </span>
      <span>
        {leaf}
        <span className={styles.ext}>.html</span>
      </span>
      <span className={styles.cursor}>_</span>
    </div>
  );
}
