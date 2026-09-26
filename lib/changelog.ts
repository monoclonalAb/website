export type ChangelogEntry = {
  /** Shown as the heading; also the permanent #changelog-<version> anchor. */
  version: string;
  date: string;
  summary: string;
  /** Optional phrase within `summary` to link. */
  link?: { text: string; href: string };
};

/** Newest first. Shared by /changelog and /changelog.xml. */
export const changelog: ChangelogEntry[] = [
  {
    version: "1.2.1",
    date: "2025-07-06",
    summary:
      "added a table of contents to every article, reformatting all blog and leetcode posts",
  },
  {
    version: "1.2.0",
    date: "2025-05-18",
    summary: "third blog post of the year on c++ (I am not slacking)",
    link: { text: "c++", href: "/blog/sightseeing-the-sea-of-cpp-1" },
  },
  {
    version: "1.1.1",
    date: "2025-03-10",
    summary:
      "minor infrastructure changes (e.g. change to leetcode file structure) and style changes (e.g. slightly muted colours, can actually differentiate what a link looks like now)",
  },
  {
    version: "1.1.0",
    date: "2025-02-26",
    summary: "second blog post of the year on competitive programming",
    link: {
      text: "competitive programming",
      href: "/blog/uncompetitively-competing-in-competitive-programming",
    },
  },
  {
    version: "1.0.3",
    date: "2025-02-08",
    summary:
      "update design of ./leetcode page and using Eiko as my header font",
    link: { text: "./leetcode", href: "/leetcode" },
  },
  {
    version: "1.0.2",
    date: "2025-01-28",
    summary: "created a Makefile command to catch up with older problems",
  },
  {
    version: "1.0.1",
    date: "2025-01-18",
    summary: "creation of the ./leetcode page",
    link: { text: "./leetcode", href: "/leetcode" },
  },
  {
    version: "1.0.0",
    date: "2025-01-09",
    summary: "official launch of the site & wrote a blog post on group theory",
    link: { text: "group theory", href: "/blog/group-theory" },
  },
];

export const changelogId = (entry: ChangelogEntry) =>
  `changelog-${entry.version.replaceAll(".", "-")}`;
