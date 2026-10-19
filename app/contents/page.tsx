import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { pageMetadata } from "@/lib/metadata";
import styles from "./contents.module.css";

export const metadata = pageMetadata(
  "Contents",
  "/contents",
  "a directory of what you can find on eric's website and where you can find him",
);

export default function ContentsPage() {
  return (
    <ReadingPage current="contents">
      <h1>
        contents<span>:</span>
      </h1>
      <p>my attempt at making my website somewhat navigable.</p>

      <section className={styles.group}>
        <h2 id="internal-links">
          internal links<span>:</span>
        </h2>
        <dl className={styles.directory}>
          <div>
            <dt>
              <Link href="/">home</Link>
            </dt>
            <dd>
              cause every website needs a <em>fancy</em> welcome page
            </dd>
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
            <dd>
              this page <em>(riveting)</em>
            </dd>
          </div>
          <div>
            <dt>
              <Link href="/changelog">changelog</Link>
            </dt>
            <dd>what&apos;s changed</dd>
          </div>
          <div>
            <dt>
              <Link href="/leetcode">leetcode</Link>
            </dt>
            <dd>an archive of my daily questions</dd>
          </div>
          <div>
            <dt>
              <Link href="/friends">friends</Link>
            </dt>
            <dd>my friends&apos; corners of the internet</dd>
          </div>
        </dl>
      </section>

      <section className={styles.external}>
        <div className={styles.group}>
          <h2 id="external-links">
            external links<span>:</span>
          </h2>
          <p>where you can find me housed on the internet</p>
        </div>

        <section className={styles.group}>
          <h3 id="social-media">
            social media<span>:</span>
          </h3>
          <dl className={styles.directory}>
            <div>
              <dt>
                <a href="https://github.com/monoclonalAb" target="_blank">
                  github
                </a>
              </dt>
              <dd>code</dd>
            </div>
            <div>
              <dt>
                <a
                  href="https://www.linkedin.com/in/eric-zheng-nz/"
                  target="_blank"
                >
                  linkedin
                </a>
              </dt>
              <dd>unfortunately, we live in a society</dd>
            </div>
            <div>
              <dt>
                <a
                  href="https://www.strava.com/athletes/130332761"
                  target="_blank"
                >
                  strava
                </a>
              </dt>
              <dd>follow for only the best conversational runs</dd>
            </div>
            <div>
              <dt>
                <a
                  href="https://open.spotify.com/user/2kxtbesq6jyddc615ge4lpuqq"
                  target="_blank"
                >
                  spotify
                </a>
              </dt>
              <dd>for all my half-marathon playlists</dd>
            </div>
            <div>
              <dt>
                <a href="https://www.instagram.com/erizheng/" target="_blank">
                  instagram
                </a>
              </dt>
              <dd>obligatory instagram mention</dd>
            </div>
          </dl>
        </section>

        <section className={styles.group}>
          <h3 id="emails">
            emails<span>:</span>
          </h3>
          <dl className={`${styles.directory} ${styles.emails}`}>
            <div>
              <dt>
                <a href="mailto:ericzheng.nz@gmail.com">
                  ericzheng.nz@gmail.com
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
              <dd>
                my{" "}
                <i>
                  <s>current</s>
                </i>{" "}
                previous university email
              </dd>
            </div>
          </dl>
        </section>
      </section>
    </ReadingPage>
  );
}
