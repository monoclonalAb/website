/**
 * The home page's scroll tiles, in document order: the hero splash then the four
 * prose sections. These ids are the contract between app/page.tsx (which renders
 * them), the navbar's /#anchor links, the next.config.ts redirects and
 * app/scroll/PagerScroll.tsx. A tile absent from the DOM is skipped, not an error.
 */
export const TILE_IDS = ["top", "about", "blog", "contents", "changelog"] as const;
