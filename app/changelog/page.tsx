import ReadingPage from "@/components/ReadingPage";
import { changelogId, getChangelog } from "@/lib/changelog";
import { pageMetadata } from "@/lib/metadata";
import styles from "./changelog.module.css";

export const metadata = pageMetadata(
  "Changelog",
  "/changelog",
  "updates to eric zheng's personal website, which you can subscribe to with rss",
);

export default async function ChangelogPage() {
  const changelog = await getChangelog();
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
      <ol className={styles.list}>
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
            <div dangerouslySetInnerHTML={{ __html: entry.html }} />
          </li>
        ))}
      </ol>
    </ReadingPage>
  );
}
