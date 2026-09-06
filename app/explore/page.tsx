import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ericPhoto from "@/public/images/eric_photo_2.jpg";
import styles from "./ExplorePage.module.css";

export const metadata: Metadata = {
  title: "Academic style study",
  description:
    "An unlisted visual study for an unconventional academic direction for Eric Zheng's site.",
  alternates: { canonical: "/explore" },
  robots: { index: false, follow: false },
};

const studies = [
  ["00", "index", "#study-index"],
  ["01", "about", "#study-about"],
  ["02", "blog", "#study-blog"],
  ["03", "contents", "#study-contents"],
  ["04", "changelog", "#study-changelog"],
  ["05", "leetcode", "#study-leetcode"],
] as const;

export default function ExplorePage() {
  return (
    <main className={styles.study}>
      <header className={styles.utilityBar}>
        <Link className={styles.wordmark} href="/#top">
          ez<span>/</span>field-notes
        </Link>
        <p>visual inquiry · 01</p>
        <Link className={styles.returnLink} href="/#top">
          return to current site ↗
        </Link>
      </header>

      <nav className={styles.studyIndex} aria-label="Style study index">
        <p className={styles.indexLabel}>specimen register</p>
        <ol>
          {studies.map(([number, label, href]) => (
            <li key={label}>
              <a href={href}>
                <span>{number}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
        <p className={styles.draftMark}>UNLISTED / DRAFT</p>
      </nav>

      <section
        className={`${styles.specimen} ${styles.cover}`}
        id="study-index"
        aria-labelledby="index-title"
      >
        <div className={styles.registration} aria-hidden="true">
          <span>NZ</span>
          <span>36.8509° S</span>
          <span>174.7645° E</span>
        </div>
        <p className={styles.kicker}>Specimen 00 · alternate index</p>
        <div className={styles.coverTitle}>
          <h1 id="index-title">
            Eric
            <br />
            Zheng<span>.</span>
          </h1>
          <p className={styles.degree}>BSc candidate / 2025</p>
        </div>
        <div className={styles.abstract}>
          <p className={styles.abstractLabel}>Abstract</p>
          <p>
            Undergraduate student investigating the useful overlap between
            <em> mathematics</em>, <em>computer science</em>, and things worth
            being needlessly curious about.
          </p>
          <dl>
            <div>
              <dt>Based</dt>
              <dd>Tāmaki Makaurau</dd>
            </div>
            <div>
              <dt>Currently</dt>
              <dd>learning in public</dd>
            </div>
            <div>
              <dt>Notation</dt>
              <dd>ez / 001</dd>
            </div>
          </dl>
        </div>
        <p className={styles.coverNote}>
          A homepage treated as a thesis cover: quieter, stranger, and more
          authored than a portfolio hero.
        </p>
        <span className={styles.issueNumber} aria-hidden="true">
          00
        </span>
      </section>

      <section
        className={`${styles.specimen} ${styles.about}`}
        id="study-about"
        aria-labelledby="about-title"
      >
        <aside className={styles.marginNote}>
          <p>Specimen 01</p>
          <p>personal abstract</p>
          <span>pp. 02—03</span>
        </aside>
        <div className={styles.sectionBody}>
          <header className={styles.sectionHeader}>
            <p className={styles.kicker}>About / biographical note</p>
            <h2 id="about-title">
              A person, not a
              <br /> professional summary<span>.</span>
            </h2>
          </header>

          <div className={styles.aboutGrid}>
            <figure className={styles.portrait}>
              <div className={styles.imageFrame}>
                <Image
                  src={ericPhoto}
                  alt="Eric Zheng at Parable House"
                  sizes="(max-width: 760px) 82vw, 420px"
                />
              </div>
              <figcaption>
                Fig. 1 — Eric at Parable House, August 2025.
              </figcaption>
            </figure>

            <div className={styles.biography}>
              <p className={styles.dropcap}>
                Eric Zheng is an undergraduate student studying Mathematics and
                Computer Science in Auckland, New Zealand.
              </p>
              <p>
                His current research programme includes becoming a fabled 10×
                developer, surviving the daily Leetcode, and determining whether
                eighty kilometres of running per week is quite enough.
              </p>
              <blockquote>
                “I wanted to be a computer scientist.”
                <cite>— yearbook, age 11</cite>
              </blockquote>
            </div>
          </div>

          <div className={styles.interests}>
            <div>
              <p className={styles.annotation}>academic interests</p>
              <ul>
                <li>Group theory</li>
                <li>Algorithms</li>
                <li>Learning in public</li>
              </ul>
            </div>
            <div>
              <p className={styles.annotation}>field interests</p>
              <ul>
                <li>Distance running</li>
                <li>Badminton</li>
                <li>Ore–Wheat–Sheep</li>
              </ul>
            </div>
            <p className={styles.scribble} aria-label="margin note">
              rigor,
              <br /> with room
              <br /> for antics ↗
            </p>
          </div>
        </div>
      </section>

      <section
        className={`${styles.specimen} ${styles.blog}`}
        id="study-blog"
        aria-labelledby="blog-title"
      >
        <aside className={styles.marginNote}>
          <p>Specimen 02</p>
          <p>working papers</p>
          <span>ISSN pending</span>
        </aside>
        <div className={styles.sectionBody}>
          <header className={styles.journalHeader}>
            <div>
              <p className={styles.kicker}>The semi-academic review</p>
              <h2 id="blog-title">
                Notes on things
                <br /> not yet understood<span>.</span>
              </h2>
            </div>
            <p className={styles.volume}>
              VOL. 00
              <br />
              AUCKLAND
              <br />
              MMXXV
            </p>
          </header>

          <div className={styles.paperGrid}>
            <article className={styles.featurePaper}>
              <p className={styles.paperType}>Editorial / forthcoming</p>
              <h3>Why leave the blank page visible?</h3>
              <p>
                The writing pipeline is being rebuilt. Instead of disguising the
                empty state, this treatment makes it read like the front matter
                of a journal before its first issue.
              </p>
              <p className={styles.byline}>E. Zheng · no abstract available</p>
            </article>
            <article>
              <p className={styles.paperType}>Planned subject 01</p>
              <h3>Group theory, eventually</h3>
              <p>Notes, diagrams, proofs, and the corrections they require.</p>
            </article>
            <article>
              <p className={styles.paperType}>Planned subject 02</p>
              <h3>The daily problem</h3>
              <p>A companion record for algorithms and stubbornness.</p>
            </article>
          </div>
          <div className={styles.submissionStrip}>
            <span>MANUSCRIPTS: 0</span>
            <span>STATUS: ACCEPTING CURIOSITY</span>
            <span>NEXT ISSUE: WHEN READY</span>
          </div>
        </div>
      </section>

      <section
        className={`${styles.specimen} ${styles.contents}`}
        id="study-contents"
        aria-labelledby="contents-title"
      >
        <aside className={styles.marginNote}>
          <p>Specimen 03</p>
          <p>card catalogue</p>
          <span>ref. EZ/A—F</span>
        </aside>
        <div className={styles.sectionBody}>
          <header className={styles.sectionHeader}>
            <p className={styles.kicker}>Directory / finding aid</p>
            <h2 id="contents-title">
              Contents arranged
              <br /> for useful wandering<span>.</span>
            </h2>
          </header>

          <div className={styles.catalogue}>
            <Link href="/#top">
              <span className={styles.callNumber}>EZ.00</span>
              <strong>Index</strong>
              <span>an unnecessarily fancy welcome</span>
              <b>↗</b>
            </Link>
            <Link href="/#about">
              <span className={styles.callNumber}>EZ.01</span>
              <strong>About</strong>
              <span>the person and the apparatus</span>
              <b>↗</b>
            </Link>
            <Link href="/#blog">
              <span className={styles.callNumber}>EZ.02</span>
              <strong>Blog</strong>
              <span>working papers, soon</span>
              <b>↗</b>
            </Link>
            <Link href="/#changelog">
              <span className={styles.callNumber}>EZ.04</span>
              <strong>Changelog</strong>
              <span>the revision history</span>
              <b>↗</b>
            </Link>
            <Link href="/leetcode">
              <span className={styles.callNumber}>EZ.05</span>
              <strong>Leetcode</strong>
              <span>a daily problem ledger</span>
              <b>↗</b>
            </Link>
          </div>

          <div className={styles.contactBlock}>
            <p className={styles.annotation}>Correspondence</p>
            <a href="mailto:theericzheng@gmail.com">theericzheng@gmail.com</a>
            <span> / </span>
            <a
              href="https://github.com/monoclonalAb"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/monoclonalAb
            </a>
          </div>
        </div>
      </section>

      <section
        className={`${styles.specimen} ${styles.changelog}`}
        id="study-changelog"
        aria-labelledby="changelog-title"
      >
        <aside className={styles.marginNote}>
          <p>Specimen 04</p>
          <p>errata ledger</p>
          <span>living document</span>
        </aside>
        <div className={styles.sectionBody}>
          <header className={styles.sectionHeader}>
            <p className={styles.kicker}>Revision history / errata</p>
            <h2 id="changelog-title">
              Every document admits
              <br /> that it has changed<span>.</span>
            </h2>
          </header>

          <div className={styles.ledger}>
            <div className={styles.ledgerHeading}>
              <span>Date</span>
              <span>Revision</span>
              <span>Record</span>
              <span>State</span>
            </div>
            <article>
              <time>—</time>
              <strong>0.0</strong>
              <p>
                No entries filed yet. The ruled ledger remains as an honest
                empty state rather than a decorative timeline.
              </p>
              <span className={styles.status}>OPEN</span>
            </article>
          </div>
          <p className={styles.rssNote}>
            <span>§</span> Follow future amendments through the{" "}
            <a href="/changelog.xml">RSS record</a>.
          </p>
        </div>
      </section>

      <section
        className={`${styles.specimen} ${styles.leetcode}`}
        id="study-leetcode"
        aria-labelledby="leetcode-title"
      >
        <aside className={styles.marginNote}>
          <p>Specimen 05</p>
          <p>problem set</p>
          <span>answers pending</span>
        </aside>
        <div className={styles.sectionBody}>
          <header className={styles.problemHeader}>
            <div>
              <p className={styles.kicker}>Algorithms / daily exercises</p>
              <h2 id="leetcode-title">
                Problem sheet
                <br /> for the commute<span>.</span>
              </h2>
            </div>
            <div className={styles.scoreBox}>
              <span>SHEET</span>
              <strong>∅</strong>
              <small>not yet marked</small>
            </div>
          </header>

          <div className={styles.problemSheet}>
            <div className={styles.problemNumber}>Q. 001</div>
            <div>
              <p className={styles.annotation}>Prompt</p>
              <h3>
                Build a daily habit without pretending the archive is full.
              </h3>
              <p>
                Group and post solutions to the daily Leetcode question. Show
                working, name the useful idea, and preserve the false starts.
              </p>
            </div>
            <aside>
              <p>Given</p>
              <code>entries = []</code>
              <p>Find</p>
              <code>consistency</code>
            </aside>
          </div>

          <div className={styles.answerArea} aria-label="Empty answer area">
            <span>working:</span>
            <p>Daily solutions coming soon.</p>
          </div>
          <Link className={styles.prototypeLink} href="/leetcode">
            open the current leetcode page ↗
          </Link>
        </div>
      </section>

      <footer className={styles.studyFooter}>
        <p>End of visual inquiry 01</p>
        <p>
          Same typefaces. New grammar. <span>No canonical pages changed.</span>
        </p>
        <a href="#study-index">return to folio 00 ↑</a>
      </footer>
    </main>
  );
}
