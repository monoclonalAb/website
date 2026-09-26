import Link from "next/link";
import styles from "./Contents.module.css";

export default function Contents() {
  return (
    <>
      <h1>
        contents<span>:</span>
      </h1>
      <p>
        ideally, I wanted the website to be a bit of maze, so having a contents
        page would be helpful to navigate the site.
      </p>
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
            <dd>cause every website needs a fancy welcome page</dd>
          </div>
          <div>
            <dt>
              <Link href="/about">about</Link>
            </dt>
            <dd>everything you need to know about the site</dd>
          </div>
          <div>
            <dt>
              <Link href="/blog">blog</Link>
            </dt>
            <dd>
              the page <b>everyone</b> is here for
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
            <dd>
              for long time fans of the page who want to know what has changed
            </dd>
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
        <div className={styles.group}>
          <h2 id="external-links">
            external links<span>:</span>
          </h2>
          <p>
            i guess this is doubling as my contacts page, as well as advertising
            where else I am housed on the internet
          </p>
        </div>
        <section className={styles.group} aria-labelledby="social-media">
          <h3 id="social-media">
            social media<span>:</span>
          </h3>
          <dl className={styles.directory}>
            <div>
              <dt>
                <a href="https://github.com/monoclonalAb">github</a>
              </dt>
              <dd>github.com/monoclonalAb</dd>
            </div>
            <div>
              <dt>
                <a href="https://www.linkedin.com/in/eric-zheng-nz/">
                  linkedin
                </a>
              </dt>
              <dd>linkedin.com/in/eric-zheng-nz</dd>
            </div>
            <div>
              <dt>
                <a href="https://www.strava.com/athletes/130332761">strava</a>
              </dt>
              <dd>strava.com/athletes/130332761</dd>
            </div>
            <div>
              <dt>
                <a href="https://www.instagram.com/erizheng/">instagram</a>
              </dt>
              <dd>instagram.com/erizheng</dd>
            </div>
            <div>
              <dt>
                <span>discord</span>
              </dt>
              <dd>monoclonalab</dd>
            </div>
          </dl>
        </section>
        <section className={styles.group} aria-labelledby="emails">
          <h3 id="emails">
            emails<span>:</span>
          </h3>
          <dl className={`${styles.directory} ${styles.emails}`}>
            <div>
              <dt>
                <a href="mailto:theericzheng@gmail.com">
                  theericzheng@gmail.com
                </a>
              </dt>
              <dd>my main gmail</dd>
            </div>
            <div>
              <dt>
                <a href="mailto:eric.zheng@outlook.com">
                  eric.zheng@outlook.com
                </a>
              </dt>
              <dd>my main outlook</dd>
            </div>
            <div>
              <dt>
                <a href="mailto:ezhe473@aucklanduni.ac.nz">
                  ezhe473@aucklanduni.ac.nz
                </a>
              </dt>
              <dd>my current university email</dd>
            </div>
          </dl>
        </section>
      </section>
    </>
  );
}
