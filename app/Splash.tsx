"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./splash.module.css";

/**
 * Animated landing splash ported from the source index.html.
 *
 * Two black `.titleContainer` panels reveal via clip-path keyframes over an
 * underlying "inverse" name layer. When the right-hand panel finishes its
 * animation, the left-hand name recolours from red to black (this replaces the
 * source's inline `animationend` script).
 */
export default function Splash() {
  const [nameRevealed, setNameRevealed] = useState(false);

  // Lock scrolling while the splash owns the viewport; restore on leave.
  useEffect(() => {
    const html = document.documentElement;
    const { overflow: prevHtml } = html.style;
    const { overflow: prevBody } = document.body.style;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div className={styles.siteContainer}>
      {/* underlying name layer (starts red, recolours to black on reveal) */}
      <h1
        className={`${styles.title} ${styles.lhs} ${styles.inverse}`}
        style={nameRevealed ? { color: "#161616" } : undefined}
      >
        <span>ABCDEF</span>
        <br />
        <span>GHIJKL</span>
        <br />
        <span>M</span>ERIC<span>N</span>
        <br />
        <span>O</span>ZHENG<span></span>
        <br />
        <span>PQRSTU</span>
        <br />
        <span>VWXYZ</span>
        <br />
        <span></span>
        <br />
        <span></span>
        <br />
        <span></span>
        <br />
      </h1>

      {/* underlying nav layer */}
      <h1 className={`${styles.title} ${styles.rhs} ${styles.inverse}`}>
        <span></span>
        <br />
        <span></span>
        <br />
        <span></span>abcdefg
        <br />
        <span></span>haboutij<span></span>
        <br />
        <span></span>klmblogn<span></span>
        <br />
        <span></span>ocontents<span></span>
        <br />
        <span></span>pchangelog<span></span>
        <br />
        <span></span>qrstuvwxyz
        <br />
        <span></span>
        <br />
      </h1>

      {/* left black panel: wipes in then out, revealing the name */}
      <div className={styles.titleContainer}>
        <h1 className={`${styles.title} ${styles.lhs}`}>
          <span></span>ABCDEF
          <br />
          <span></span>GHIJKL
          <br />
          <span></span>MERICN<span></span>
          <br />
          <span></span>OZHENG<span></span>
          <br />
          <span></span>PQRSTU
          <br />
          <span></span>VWXYZ
          <br />
          <span></span>
          <br />
          <span></span>
          <br />
          <span></span>
          <br />
        </h1>
      </div>

      {/* right black panel: wipes in, revealing the nav links */}
      <div
        className={styles.titleContainer}
        onAnimationEnd={() => setNameRevealed(true)}
      >
        <h1 className={`${styles.title} ${styles.rhs} underline-animation`}>
          <span></span>
          <br />
          <span></span>
          <br />
          <span>abcdefg</span>
          <br />
          <span>h</span>
          <Link href="/about">about</Link>
          <span>ij</span>
          <br />
          <span>klm</span>
          <Link href="/blog">blog</Link>
          <span>n</span>
          <br />
          <span>o</span>
          <Link href="/contents">contents</Link>
          <span></span>
          <br />
          <span>p</span>
          <Link href="/changelog">changelog</Link>
          <span></span>
          <br />
          <span>qrstuvwxyz</span>
          <br />
          <span></span>
          <br />
        </h1>
      </div>
    </div>
  );
}
