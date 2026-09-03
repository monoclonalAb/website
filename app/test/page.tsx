import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";
import styles from "./TestPage.module.css";

export const metadata: Metadata = {
  title: "Dial playground",
  description: "An unlisted playground for exercising the site's heading dial.",
  alternates: { canonical: "/test" },
  robots: { index: false, follow: false },
};

export default function TestPage() {
  return (
    <SiteChrome>
      <article className={styles.lab}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>
            unlisted field note · dial specimen 001
          </p>
          <h1>
            test<span>:</span>
          </h1>
          <p className={styles.lede}>
            A tiny, over-engineered room for turning the new site dial and
            seeing what shakes loose.
          </p>
          <dl className={styles.readout} aria-label="test page status">
            <div>
              <dt>signal</dt>
              <dd>nominal</dd>
            </div>
            <div>
              <dt>headings</dt>
              <dd>h1—h6</dd>
            </div>
            <div>
              <dt>indexing</dt>
              <dd>absolutely not</dd>
            </div>
          </dl>
          <div className={styles.scrollHint} aria-hidden="true">
            turn dial ↓
          </div>
        </header>

        <section className={styles.panel}>
          <p className={styles.index}>01 / calibration</p>
          <h2>
            boot sequence<span>:</span>
          </h2>
          <p>
            Start at the file row. As this heading crosses the reading line, the
            red caret should leave <code>test.html</code> and settle here.
          </p>
          <div className={styles.tape}>SCROLL · OBSERVE · REPEAT</div>

          <h3>
            hierarchy protocol<span>:</span>
          </h3>
          <p>
            Smaller headings nest beneath larger ones. The branches are drawn
            from document order, not from these decorative boxes.
          </p>

          <h4>
            fourth order<span>:</span>
          </h4>
          <p>The tree is getting narrow now. The signal is still clear.</p>

          <h5>
            low signal<span>:</span>
          </h5>
          <p>Fifth-level headings are unusual, which makes them useful here.</p>

          <h6>
            carrier whisper<span>:</span>
          </h6>
          <p>
            This is the smallest legal transmission. If you can read it, the
            experiment continues.
          </p>
        </section>

        <section className={`${styles.panel} ${styles.darkPanel}`}>
          <p className={styles.index}>02 / inputs</p>
          <h2>
            input deck<span>:</span>
          </h2>
          <p>
            Give the page a wheel, a trackpad, arrow keys, Page Down, or the
            rail links themselves. This route uses native document scrolling.
          </p>

          <div className={styles.specimenGrid}>
            <div>
              <span aria-hidden="true">↕</span>
              <b>continuous</b>
              <small>trackpad</small>
            </div>
            <div>
              <span aria-hidden="true">⌁</span>
              <b>detented</b>
              <small>mouse wheel</small>
            </div>
            <div>
              <span aria-hidden="true">⇥</span>
              <b>precise</b>
              <small>keyboard</small>
            </div>
          </div>

          <h3>
            analogue motion<span>:</span>
          </h3>
          <p>
            Move slowly, then quickly. The caret should remain comprehensible.
          </p>

          <h4>
            momentum tail<span>:</span>
          </h4>
          <p>
            Let the page coast. The highlighted row should follow the prose.
          </p>

          <h3>
            keyboard channel<span>:</span>
          </h3>
          <p>Tab into the dial and use its plain fragment links.</p>

          <h4>
            focus return<span>:</span>
          </h4>
          <p>A visible outline is a feature, not a rendering accident.</p>
        </section>

        <section className={styles.panel}>
          <p className={styles.index}>03 / collision lab</p>
          <h2>
            duplicate signals<span>:</span>
          </h2>
          <p>
            These next two labels deliberately match. The scanner should mint
            distinct anchors while leaving their human-readable names alone.
          </p>

          <h3>
            echo<span>:</span>
          </h3>
          <blockquote className={styles.echo}>
            hello from the first chamber
          </blockquote>

          <h3>
            echo<span>:</span>
          </h3>
          <blockquote className={`${styles.echo} ${styles.echoLate}`}>
            hello from the second chamber
          </blockquote>
        </section>

        <section className={`${styles.panel} ${styles.finalPanel}`}>
          <p className={styles.index}>04 / end of line</p>
          <h2>
            escape hatch<span>:</span>
          </h2>
          <p>
            The disposable experiment ends here. The little <code>ez</code> in
            the top-right corner returns to the real site whenever you are
            ready.
          </p>
          <p className={styles.stamp}>PASS, PROBABLY</p>
          <Link className={styles.exit} href="/#top">
            exit test.html →
          </Link>
        </section>
      </article>
    </SiteChrome>
  );
}
