import { TILE_IDS } from "./tiles";

/**
 * The site as a file tree — the single list the rail (components/SiteRail.tsx) and the
 * crumb (components/SiteCrumb.tsx) both read, in the same spirit as TILE_IDS above it.
 *
 * There are no routes, so the `.html` filenames are a fiction; it is the site's own
 * fiction, since the `contents` section already names its sections `/about.html`.
 *
 * A file's leading h1 that merely restates the file name folds INTO the file line rather
 * than becoming a row of its own — which is why `blog` and `changelog` list no headings
 * and `contents` starts at `internal links`. That rule lives here as an absence, not as
 * code: to give a section rail rows, list its headings; to fold one, leave it out.
 *
 * Every `id` below is a real element id in the DOM — the tile ids on <section> in
 * app/page.tsx, the heading ids in app/_sections/*.tsx — so a row is a plain anchor and
 * the scrollspy can measure it. Adding a row here without adding the id gets you a row
 * that reads as active but cannot be jumped to.
 *
 * This tree is the HOME page's outline only. Standalone routes build the same row
 * shape at runtime from their own heading tags — components/useHeadingOutline.ts —
 * through the exported buildOutlineRows below.
 */

export type TileId = (typeof TILE_IDS)[number];

export type OutlineNode = {
  id: string;
  label: string;
  children?: OutlineNode[];
};

const TREE: OutlineNode[] = [
  { id: "top", label: "index.html" },
  {
    id: "about",
    label: "about.html",
    children: [
      {
        id: "about-me",
        label: "about me",
        children: [{ id: "fun-fact", label: "fun fact" }],
      },
      { id: "about-this-site", label: "about this site" },
      { id: "footnote", label: "footnote" },
    ],
  },
  { id: "blog", label: "blog.html" },
  {
    id: "contents",
    label: "contents.html",
    children: [
      { id: "internal-links", label: "internal links" },
      {
        id: "external-links",
        label: "external links",
        children: [
          { id: "emails", label: "emails" },
          { id: "social-media", label: "social media" },
        ],
      },
    ],
  },
  { id: "changelog", label: "changelog.html" },
];

export type OutlineRow = {
  id: string;
  label: string;
  /** 1 = file line. Drives both the indent and the tick width. */
  depth: number;
  /**
   * The scroll tile this row lives in; a file row's own id. A `TileId` on the home
   * page; on standalone routes it is whatever id the heading scan anchored the file
   * row to (components/useHeadingOutline.ts), so the type is the wider string.
   */
  tile: string;
  /** Tree-drawing glyphs, one per depth level, ending in the row's own branch. */
  prefix: string;
  isFile: boolean;
};

/**
 * Standard tree-drawing glyphs: the row's own branch is `└` when it is the last of its
 * siblings and `├` otherwise, preceded by one glyph per ancestor — `│` where that
 * ancestor has siblings still to come below, a space where it does not.
 *
 * These are computed against the WHOLE tree, deliberately. The rail only ever shows one
 * file's headings at a time, but collapsing the other files changes no glyph: a file's
 * branch depends only on the files around it, and a heading's spine only on whether its
 * own file has files below it. So a row's prefix is a constant, not a function of what
 * happens to be expanded.
 */
const flatten = (
  nodes: OutlineNode[],
  depth: number,
  tile: string | null,
  spine: string,
): OutlineRow[] =>
  nodes.flatMap((node, i) => {
    const last = i === nodes.length - 1;
    const rowTile = tile ?? node.id;
    const row: OutlineRow = {
      id: node.id,
      label: node.label,
      depth,
      tile: rowTile,
      prefix: spine + (last ? "└" : "├"),
      isFile: depth === 1,
    };
    return node.children
      ? [
          row,
          ...flatten(
            node.children,
            depth + 1,
            rowTile,
            spine + (last ? " " : "│"),
          ),
        ]
      : [row];
  });

/**
 * Rows from any outline tree — the home TREE below, or a tree scanned off a page's
 * headings (components/useHeadingOutline.ts). Same glyphs, same shape, one renderer.
 */
export const buildOutlineRows = (nodes: OutlineNode[]): OutlineRow[] =>
  flatten(nodes, 1, null, "");

/** All 13 rows in document order. The visible subset is chosen per tile below. */
export const OUTLINE_ROWS = buildOutlineRows(TREE);

/**
 * What the rail shows on a given tile: every file line, plus only that tile's headings.
 * So `blog` and `changelog` are five rows and `about` and `contents` are nine — the
 * headings expand downwards on arrival and collapse again on leaving.
 */
export const isRowVisible = (row: OutlineRow, activeTile: string | null) =>
  row.isFile || row.tile === activeTile;
