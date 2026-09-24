export type ChangelogEntry = {
  /** Stable, URL-safe identifier. Do not change it after publishing. */
  id: string;
  /** A version number or short name shown as the entry heading. */
  title: string;
  /** Calendar date in YYYY-MM-DD form. */
  publishedOn: `${number}-${number}-${number}`;
  /** Plain-text copy shared by the web page and RSS readers. */
  summary: string;
  /** Optional linked phrase within the plain-text summary. */
  link?: { text: string; href: string };
};

/** Newest first. Historical releases imported from the original static site. */
export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    id: "1-2-1",
    title: "1.2.1",
    publishedOn: "2025-07-06",
    summary:
      "added a table of contents to every article, reformatting all blog and leetcode posts",
  },
  {
    id: "1-2-0",
    title: "1.2.0",
    publishedOn: "2025-05-18",
    summary: "third blog post of the year on c++ (I am not slacking)",
    link: { text: "c++", href: "/blog/sightseeing-the-sea-of-cpp-1" },
  },
  {
    id: "1-1-1",
    title: "1.1.1",
    publishedOn: "2025-03-10",
    summary:
      "minor infrastructure changes (e.g. change to leetcode file structure) and style changes (e.g. slightly muted colours, can actually differentiate what a link looks like now)",
  },
  {
    id: "1-1-0",
    title: "1.1.0",
    publishedOn: "2025-02-26",
    summary: "second blog post of the year on competitive programming",
    link: {
      text: "competitive programming",
      href: "/blog/uncompetitively-competing-in-competitive-programming",
    },
  },
  {
    id: "1-0-3",
    title: "1.0.3",
    publishedOn: "2025-02-08",
    summary:
      "update design of ./leetcode page and using Eiko as my header font",
    link: { text: "./leetcode", href: "/leetcode" },
  },
  {
    id: "1-0-2",
    title: "1.0.2",
    publishedOn: "2025-01-28",
    summary: "created a Makefile command to catch up with older problems",
  },
  {
    id: "1-0-1",
    title: "1.0.1",
    publishedOn: "2025-01-18",
    summary: "creation of the ./leetcode page",
    link: { text: "./leetcode", href: "/leetcode" },
  },
  {
    id: "1-0-0",
    title: "1.0.0",
    publishedOn: "2025-01-09",
    summary: "official launch of the site & wrote a blog post on group theory",
    link: { text: "group theory", href: "/blog/group-theory" },
  },
];

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
