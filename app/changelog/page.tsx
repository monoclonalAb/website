import ReadingPage from "@/components/ReadingPage";
import entries from "@/components/entries.module.css";
import { changelog, changelogId, type ChangelogEntry } from "@/lib/changelog";
import { pageMetadata } from "@/lib/metadata";
import styles from "./changelog.module.css";

export const metadata = pageMetadata(
  "Changelog",
  "/changelog",
  "updates to eric zheng's personal website, which you can subscribe to with rss",
);

function Summary({ summary, link }: ChangelogEntry) {
  if (!link) return <p>{summary}</p>;
  const [before, after] = summary.split(link.text);
  return (
    <p>
      {before}
      <a href={link.href}>{link.text}</a>
      {after}
    </p>
  );
}

export default function ChangelogPage() {
  return (
    <ReadingPage current="changelog">
      <div className={styles.title}>
        <h1>
          changelog<span>:</span>
        </h1>
        <p className={styles.rss}>
          subscribe with <a href="/changelog.xml">rss</a>
        </p>
      </div>
      <p>the update log!!</p>
      <ol className={entries.list}>
        {changelog.map((entry) => (
          <li key={entry.version} id={changelogId(entry)}>
            <time dateTime={entry.date}>
              {new Date(entry.date).toLocaleDateString("en-NZ", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>
            <div>
              <h2>{entry.version}</h2>
              <Summary {...entry} />
            </div>
          </li>
        ))}
      </ol>
    </ReadingPage>
  );
}
