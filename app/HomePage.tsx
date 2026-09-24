import type { CSSProperties, ReactNode } from "react";
import styles from "./HomePage.module.css";
import ScrollWaves from "@/components/ScrollWaves";

type AlphabetRowProps = {
  upper?: ReactNode;
  before?: string;
  after?: string;
  href?: string;
  children?: string;
};

/** Keep the hit box at rest; only its visual label and neighbouring letters move. */
function AlphabetRow({
  upper,
  before = "",
  after,
  href,
  children = "",
}: AlphabetRowProps) {
  return (
    <div
      className={styles.row}
      style={
        {
          "--half-gaps": (children.length - 1) / 2,
          "--prefix-letters": before.length,
        } as CSSProperties
      }
    >
      <div className={styles.upper} aria-hidden="true">
        <span className={styles.upperText}>{upper}</span>
      </div>
      <div className={styles.lower}>
        {href ? (
          <>
            <span className={styles.prefix} aria-hidden="true">
              <span className={styles.measure}>{before}</span>
              {/* Fixed clips recolour crossing letters at the background split. */}
              <span className={styles.lightPrefix}>
                <span className={styles.prefixText}>{before}</span>
              </span>
              <span className={styles.darkPrefix}>
                <span className={styles.prefixText}>{before}</span>
              </span>
            </span>
            <a href={href} className={styles.link}>
              <span className={styles.measure} aria-hidden="true">
                {children}
              </span>
              <span className={styles.word}>{children}</span>
            </a>
            <span className={styles.suffix} aria-hidden="true">
              {after}
            </span>
          </>
        ) : (
          <span aria-hidden="true">{children}</span>
        )}
      </div>
    </div>
  );
}

/** Server-rendered alphabet artwork with four native, CSS-enhanced page links. */
export default function HomePage() {
  return (
    <main id="top" className={styles.hero}>
      <ScrollWaves opening />
      <ScrollWaves opening side="left" />
      <h1 className="sr-only">Eric Zheng</h1>
      <nav
        id="pages"
        tabIndex={-1}
        className={styles.alphabet}
        aria-label="Introduction"
      >
        <AlphabetRow upper="ABCDEF" />
        <AlphabetRow upper="GHIJKL" />
        <AlphabetRow
          upper={
            <>
              M<span className={styles.accent}>ERIC</span>N
            </>
          }
        >
          abcdefg
        </AlphabetRow>
        <AlphabetRow
          upper={
            <>
              O<span className={styles.accent}>ZHENG</span>
            </>
          }
          before="h"
          after="ij"
          href="/about"
        >
          about
        </AlphabetRow>
        <AlphabetRow upper="PQRSTU" before="klm" after="n" href="/blog">
          blog
        </AlphabetRow>
        <AlphabetRow upper="VWXYZ" before="o" href="/contents">
          contents
        </AlphabetRow>
        <AlphabetRow before="p" href="/changelog">
          changelog
        </AlphabetRow>
        <AlphabetRow>qrstuvwxyz</AlphabetRow>
      </nav>
    </main>
  );
}
