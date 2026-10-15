import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ScrollWaves from "@/components/ScrollWaves";
import styles from "./home.module.css";

export const metadata: Metadata = { title: { absolute: "Eric Zheng" } };

// "Eric Zheng" is a shared name; sameAs ties this site to Eric's own profiles.
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Eric Zheng",
  url: "https://ericzheng.nz",
  image: "https://ericzheng.nz/images/eric_photo_2.jpg",
  jobTitle: "Undergraduate student",
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "University of Auckland",
  },
  knowsAbout: ["Mathematics", "Computer Science"],
  sameAs: [
    "https://github.com/monoclonalAb",
    "https://www.linkedin.com/in/eric-zheng-nz/",
    "https://www.kaggle.com/monoclonal",
  ],
};

/**
 * One row of the split alphabet. Upper-case letters sit right of centre on the
 * light half, lower-case letters left of centre on the dark half. On hover or
 * focus, a linked row spreads its letters while the link stays centred.
 * Without `live`, the row is a painted copy: same layout, no link.
 */
function Row({
  upper,
  before = "",
  after,
  href,
  live,
  children = "",
}: {
  upper?: ReactNode;
  before?: string;
  after?: string;
  href?: string;
  live: boolean;
  children?: string;
}) {
  const vars = {
    "--half-gaps": (children.length - 1) / 2,
    "--prefix-letters": before.length,
  } as CSSProperties;
  const word = (
    <>
      <span className={styles.measure} aria-hidden="true">
        {children}
      </span>
      <span className={styles.word}>{children}</span>
    </>
  );
  return (
    <div className={styles.row} style={vars}>
      <div className={styles.upper} aria-hidden="true">
        <span className={styles.upperText}>{upper}</span>
      </div>
      <div className={styles.lower}>
        {href ? (
          <>
            <span className={styles.prefix} aria-hidden="true">
              <span className={styles.measure}>{before}</span>
              {/* Two clipped copies recolour letters that cross the split. */}
              <span className={styles.lightPrefix}>
                <span className={styles.prefixText}>{before}</span>
              </span>
              <span className={styles.darkPrefix}>
                <span className={styles.prefixText}>{before}</span>
              </span>
            </span>
            {live ? (
              <Link href={href} className={styles.link}>
                {word}
              </Link>
            ) : (
              <span className={styles.link}>{word}</span>
            )}
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

function Alphabet({ live = false }: { live?: boolean }) {
  return (
    <>
      <Row live={live} upper="ABCDEF" />
      <Row live={live} upper="GHIJKL" />
      <Row
        live={live}
        upper={
          <>
            M<span className={styles.accent}>ERIC</span>N
          </>
        }
      >
        abcdefg
      </Row>
      <Row
        live={live}
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
      </Row>
      <Row live={live} upper="PQRSTU" before="klm" after="n" href="/blog">
        blog
      </Row>
      <Row live={live} upper="VWXYZ" before="o" href="/contents">
        contents
      </Row>
      <Row live={live} before="p" href="/changelog">
        changelog
      </Row>
      <Row live={live}>qrstuvwxyz</Row>
    </>
  );
}

export default function Home() {
  return (
    <main className={styles.hero}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <ScrollWaves opening />
      <ScrollWaves opening side="left" />
      <h1 className="sr-only">Eric Zheng</h1>
      <nav className={styles.alphabet} aria-label="Introduction">
        <Alphabet live />
      </nav>
      {/*
        The opening, after the first ericzheng.nz: two painted copies of the
        alphabet are clipped away over the real one, which works throughout.
      */}
      <div className={styles.curtain} aria-hidden="true">
        <div className={styles.alphabet}>
          <Alphabet />
        </div>
      </div>
      <div className={styles.cover} aria-hidden="true">
        <div className={styles.alphabet}>
          <Alphabet />
        </div>
      </div>
    </main>
  );
}
