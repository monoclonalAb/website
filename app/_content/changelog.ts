export type ChangelogEntry = {
  /** Stable, URL-safe identifier. Do not change it after publishing. */
  id: string;
  /** A version number or short name shown as the entry heading. */
  title: string;
  /** Calendar date in YYYY-MM-DD form. */
  publishedOn: `${number}-${number}-${number}`;
  /** Plain-text copy shared by the web page and RSS readers. */
  summary: string;
};

/**
 * Newest first. This remains deliberately empty until there is a new update to
 * publish; adding one record makes it appear on both the changelog page and RSS feed.
 */
export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [];

export function changelogEntryId(entry: ChangelogEntry) {
  return `changelog-${entry.id}`;
}

export function changelogEntryPath(entry: ChangelogEntry) {
  return `/changelog#${encodeURIComponent(changelogEntryId(entry))}`;
}

export function changelogEntryDate(entry: ChangelogEntry) {
  const date = new Date(`${entry.publishedOn}T00:00:00.000Z`);

  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== entry.publishedOn
  ) {
    throw new Error(
      `Invalid changelog date for ${entry.id}: ${entry.publishedOn}`,
    );
  }

  return date;
}
