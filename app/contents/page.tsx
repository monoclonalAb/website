import Link from "next/link";
import type { ReactNode } from "react";
import ReadingPage from "@/components/ReadingPage";
import { pageMetadata } from "@/lib/metadata";
import styles from "./contents.module.css";

export const metadata = pageMetadata(
  "Contents",
  "/contents",
  "A directory of every main page on Eric Zheng's website, plus social profiles and email addresses.",
);

const pages: [string, string, ReactNode][] = [
  ["/", "home", "cause every website needs a fancy welcome page"],
  ["/about", "about", "everything you need to know about the site"],
  [
    "/blog",
    "blog",
    <>
      the page <b>everyone</b> is here for
    </>,
  ],
  ["/contents", "contents", "this page (riveting)"],
  [
    "/changelog",
    "changelog",
    "for long time fans of the page who want to know what has changed",
  ],
  ["/leetcode", "leetcode", "to keep track of my daily records"],
];

const profiles = [
  ["github", "https://github.com/monoclonalAb"],
  ["linkedin", "https://www.linkedin.com/in/eric-zheng-nz/"],
  ["strava", "https://www.strava.com/athletes/130332761"],
  ["instagram", "https://www.instagram.com/erizheng/"],
];

const emails = [
  ["theericzheng@gmail.com", "my main gmail"],
  ["eric.zheng@outlook.com", "my main outlook"],
  ["ezhe473@aucklanduni.ac.nz", "my current university email"],
];

function Directory({
  rows,
  className = "",
}: {
  rows: [ReactNode, ReactNode][];
  className?: string;
}) {
  return (
    <dl className={`${styles.directory} ${className}`}>
      {rows.map(([term, description], i) => (
        <div key={i}>
          <dt>{term}</dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ContentsPage() {
  return (
    <ReadingPage current="contents">
      <h1>
        contents<span>:</span>
      </h1>
      <p>
        ideally, I wanted the website to be a bit of maze, so having a contents
        page would be helpful to navigate the site.
      </p>

      <section className={styles.group}>
        <h2 id="internal-links">
          internal links<span>:</span>
        </h2>
        <Directory
          rows={pages.map(([href, label, description]) => [
            <Link
              key={href}
              href={href}
              aria-current={href === "/contents" ? "page" : undefined}
            >
              {label}
            </Link>,
            description,
          ])}
        />
      </section>

      <section className={styles.external}>
        <div className={styles.group}>
          <h2 id="external-links">
            external links<span>:</span>
          </h2>
          <p>
            i guess this is doubling as my contacts page, as well as advertising
            where else I am housed on the internet
          </p>
        </div>

        <section className={styles.group}>
          <h3 id="social-media">
            social media<span>:</span>
          </h3>
          <Directory
            rows={[
              ...profiles.map(([label, href]): [ReactNode, ReactNode] => [
                <a key={label} href={href}>
                  {label}
                </a>,
                href.replace(/^https:\/\/(www\.)?|\/$/g, ""),
              ]),
              [<span key="discord">discord</span>, "monoclonalab"],
            ]}
          />
        </section>

        <section className={styles.group}>
          <h3 id="emails">
            emails<span>:</span>
          </h3>
          <Directory
            className={styles.emails}
            rows={emails.map(([address, description]) => [
              <a key={address} href={`mailto:${address}`}>
                {address}
              </a>,
              description,
            ])}
          />
        </section>
      </section>
    </ReadingPage>
  );
}
