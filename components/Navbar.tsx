import Link from "next/link";
import styles from "./Navbar.module.css";

/**
 * Site navigation: logo · links · socials in a 1fr/5fr/1fr grid.
 * Rendered by the (site) layout, so it appears on every page except the
 * home splash. Plain <img> is used for the social SVG icons (no next/image
 * optimization needed, and it keeps the CSS-driven sizing + hover filter).
 */
export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <h1>
          <Link href="/">
            ez<span>._</span>
          </Link>
        </h1>
      </div>

      <ul className={`${styles.links} underline-animation`}>
        <li>
          <Link href="/about">about</Link>
        </li>
        <li>
          <Link href="/blog">blog</Link>
        </li>
        <li>
          <Link href="/contents">contents</Link>
        </li>
        <li>
          <Link href="/changelog">changelog</Link>
        </li>
      </ul>

      <div className={styles.socials}>
        <a
          href="https://www.linkedin.com/in/eric-zheng-nz/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/linkedin.svg" alt="linkedin" />
        </a>
        <a
          href="https://github.com/monoclonalAb"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/github.svg" alt="github" />
        </a>
      </div>
    </nav>
  );
}
