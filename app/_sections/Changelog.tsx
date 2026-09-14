import {
  CHANGELOG_ENTRIES,
  changelogEntryDate,
  changelogEntryId,
} from "@/app/_content/changelog";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-NZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export default function Changelog() {
  return (
    <>
      <div className="section-title">
        <h2>
          changelog<span>:</span>
        </h2>
        <a className="small-links" href="/changelog.xml">
          RSS
        </a>
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
              <p>{entry.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
