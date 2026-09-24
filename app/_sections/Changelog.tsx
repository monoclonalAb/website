import {
  CHANGELOG_ENTRIES,
  changelogEntryDate,
  changelogEntryId,
  type ChangelogEntry,
} from "@/app/_content/changelog";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-NZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function Summary({ entry }: { entry: ChangelogEntry }) {
  const { summary, link } = entry;
  if (!link) return <p>{summary}</p>;
  const index = summary.indexOf(link.text);
  if (index < 0)
    throw new Error(`Missing linked phrase in changelog ${entry.id}`);
  return (
    <p>
      {summary.slice(0, index)}
      <a href={link.href}>{link.text}</a>
      {summary.slice(index + link.text.length)}
    </p>
  );
}

export default function Changelog() {
  return (
    <>
      <div className="section-title">
        <h1>
          changelog<span>:</span>
        </h1>
        <p className="rss-subscribe">
          subscribe with <a href="/changelog.xml">rss</a>
        </p>
      </div>
      {CHANGELOG_ENTRIES.length === 0 ? (
        <p className="muted">the update log!! no entries yet.</p>
      ) : (
        <ol>
          {CHANGELOG_ENTRIES.map((entry) => (
            <li id={changelogEntryId(entry)} key={entry.id}>
              <p>
                <strong>{entry.title}</strong>{" "}
                <time dateTime={entry.publishedOn}>
                  {DATE_FORMATTER.format(changelogEntryDate(entry))}
                </time>
              </p>
              <Summary entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
