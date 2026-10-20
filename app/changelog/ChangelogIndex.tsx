import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Pagination from "@/components/Pagination";
import ReadingPage from "@/components/ReadingPage";
import { getChangelog, getChangelogPage } from "@/lib/changelog";
import { pageMetadata } from "@/lib/metadata";
import { pageHref } from "@/lib/posts";
import styles from "./changelog.module.css";
import MovedEntry from "./MovedEntry";

/** /changelog and every /changelog/page/[page] share this page; only the entries differ. */
export default async function ChangelogIndex({ page }: { page: number }) {
  const result = await getChangelogPage(page);
  if (!result) notFound();
  const elsewhere = (await getChangelog()).filter(
    (entry) => !result.entries.includes(entry),
  );
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
        {result.entries.map((entry) => (
          <li key={entry.id} id={entry.id}>
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
      <Pagination
        collection="changelog"
        page={page}
        totalPages={result.totalPages}
      />
      <MovedEntry
        elsewhere={Object.fromEntries(
          elsewhere.map((entry) => [entry.id, entry.url]),
        )}
      />
    </ReadingPage>
  );
}

export const changelogIndexMetadata = (page: number): Metadata =>
  pageMetadata(
    page === 1 ? "Changelog" : `Changelog, page ${page}`,
    pageHref("changelog", page),
    "updates to eric zheng's personal website, which you can subscribe to with rss",
  );
