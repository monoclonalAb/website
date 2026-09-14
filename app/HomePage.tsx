import styles from "./HomePage.module.css";

/** Static alphabet artwork; only the four real links enter the accessibility tree. */
export default function HomePage() {
  return (
    <main id="top" className={styles.hero}>
      <h1 className="sr-only">Eric Zheng</h1>
      <div className={styles.alphabet}>
        <div className={styles.name} aria-hidden="true">
          <div>ABCDEF</div>
          <div>GHIJKL</div>
          <div>
            M<span>ERIC</span>N
          </div>
          <div>
            O<span>ZHENG</span>
          </div>
          <div>PQRSTU</div>
          <div>VWXYZ</div>
        </div>
        <nav
          id="pages"
          tabIndex={-1}
          className={styles.links}
          aria-label="Introduction"
        >
          <div aria-hidden="true">abcdefg</div>
          <div>
            <span aria-hidden="true">h</span>
            <a href="/about">about</a>
            <span aria-hidden="true">ij</span>
          </div>
          <div>
            <span aria-hidden="true">klm</span>
            <a href="/blog">blog</a>
            <span aria-hidden="true">n</span>
          </div>
          <div>
            <span aria-hidden="true">o</span>
            <a href="/contents">contents</a>
          </div>
          <div>
            <span aria-hidden="true">p</span>
            <a href="/changelog">changelog</a>
          </div>
          <div aria-hidden="true">qrstuvwxyz</div>
        </nav>
      </div>
    </main>
  );
}
