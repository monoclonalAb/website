import Link from "next/link";
import styles from "./SiteHeader.module.css";

export default function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <div className={styles.header}>
      <Link
        href={home ? "#top" : "/"}
        className={styles.logo}
        aria-label="Eric Zheng — home"
      >
        ez<span>._</span>
      </Link>
      <nav aria-label="Site navigation" className={styles.navigation}>
        <a href={home ? "#about" : "/#about"}>about</a>
        <span aria-hidden="true">~</span>
        <a href={home ? "#blog" : "/#blog"}>blog</a>
        <span aria-hidden="true">~</span>
        <a href={home ? "#contents" : "/#contents"}>contents</a>
        <span aria-hidden="true">~</span>
        <a href={home ? "#changelog" : "/#changelog"}>changelog</a>
      </nav>
    </div>
  );
}
