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
      <h1>
        changelog<span>:</span>
      </h1>
      <p>
        the update log!! subscribe via <a href="/changelog.xml">RSS</a>.
      </p>
      {CHANGELOG_ENTRIES.length === 0 ? (
        <p>no entries yet.</p>
      ) : (
        <ol className="sidebar">
          {CHANGELOG_ENTRIES.map((entry) => (
            <li id={changelogEntryId(entry)} key={entry.id}>
              <p>
                <span className="release">{entry.title}</span>{" "}
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
