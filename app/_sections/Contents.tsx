import Link from "next/link";
import styles from "./Contents.module.css";

export default function Contents() {
  return (
    <>
      <h2>
        contents<span>:</span>
      </h2>
      <p>elsewhere on this site, and on the internet.</p>
      <dl className={styles.directory}>
        <div id="internal-links">
          <dt>
            <Link href="/leetcode">leetcode</Link>
          </dt>
          <dd>to keep track of my daily records</dd>
        </div>
        <div id="external-links">
          <dt id="social-media">
            <a href="https://github.com/monoclonalAb">GitHub</a>
          </dt>
          <dd>the only social media i use</dd>
        </div>
        <div>
          <dt>
            <a href="https://www.kaggle.com/monoclonal">Kaggle</a>
          </dt>
          <dd>my favourite networking platform</dd>
        </div>
      </dl>
      <div id="emails" className={styles.emails}>
        <p>or, the old-fashioned way:</p>
        <a href="mailto:theericzheng@gmail.com">theericzheng@gmail.com</a>
        <a href="mailto:eric.zheng@outlook.com">eric.zheng@outlook.com</a>
        <a href="mailto:ezhe473@aucklanduni.ac.nz">ezhe473@aucklanduni.ac.nz</a>
      </div>
    </>
  );
}
