import Link from "next/link";
import styles from "./Contents.module.css";

export default function Contents() {
  return (
    <>
      <h1>
        contents<span>:</span>
      </h1>
      <p>a small map of this site, and where else to find me.</p>
      <section className={styles.group} aria-labelledby="internal-links">
        <h2 id="internal-links">
          internal links<span>:</span>
        </h2>
        <dl className={styles.directory}>
          <div>
            <dt>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Isolate legacy home IDs from Next's retained reading DOM. */}
              <a href="/">home</a>
            </dt>
            <dd>because every website needs a fancy welcome page</dd>
          </div>
          <div>
            <dt>
              <Link href="/about">about</Link>
            </dt>
            <dd>a little about me, and about this site</dd>
          </div>
          <div>
            <dt>
              <Link href="/blog">blog</Link>
            </dt>
            <dd>
              the page <em>everyone</em> is here for
            </dd>
          </div>
          <div>
            <dt>
              <Link href="/contents" aria-current="page">
                contents
              </Link>
            </dt>
            <dd>this page (riveting)</dd>
          </div>
          <div>
            <dt>
              <Link href="/changelog">changelog</Link>
            </dt>
            <dd>what’s changed around here</dd>
          </div>
          <div>
            <dt>
              <Link href="/leetcode">leetcode</Link>
            </dt>
            <dd>to keep track of my daily records</dd>
          </div>
        </dl>
      </section>
      <section className={styles.external} aria-labelledby="external-links">
        <h2 id="external-links">
          external links<span>:</span>
        </h2>
        <section className={styles.group} aria-labelledby="social-media">
          <h3 id="social-media">
            social media<span>:</span>
          </h3>
          <dl className={styles.directory}>
            <div>
              <dt>
                <a href="https://github.com/monoclonalAb">github</a>
              </dt>
              <dd>where the code lives</dd>
            </div>
            <div>
              <dt>
                <a href="https://www.linkedin.com/in/eric-zheng-nz/">
                  linkedin
                </a>
              </dt>
              <dd>the professional version of me</dd>
            </div>
            <div>
              <dt>
                <a href="https://www.strava.com/athletes/130332761">strava</a>
              </dt>
              <dd>a reason to leave my desk</dd>
            </div>
            <div>
              <dt>
                <a href="https://www.instagram.com/erizheng/">instagram</a>
              </dt>
              <dd>life outside the editor</dd>
            </div>
            <div>
              <dt>
                <span>discord</span>
              </dt>
              <dd>add me as monoclonalab</dd>
            </div>
          </dl>
        </section>
        <section className={styles.group} aria-labelledby="emails">
          <h3 id="emails">
            emails<span>:</span>
          </h3>
          <div className={styles.emails}>
            <a href="mailto:theericzheng@gmail.com">theericzheng@gmail.com</a>
            <a href="mailto:eric.zheng@outlook.com">eric.zheng@outlook.com</a>
            <a href="mailto:ezhe473@aucklanduni.ac.nz">
              ezhe473@aucklanduni.ac.nz
            </a>
          </div>
        </section>
      </section>
    </>
  );
}
