import styles from "./HomePage.module.css";

// Fragments never reach the server. Native :target notices keep old bookmarks
// useful without a client-side redirect, scrolling script or duplicated prose.
const destinations = [
  ["about", "/about", "about"],
  ["blog", "/blog", "blog"],
  ["contents", "/contents", "contents"],
  ["changelog", "/changelog", "changelog"],
  ["about-me", "/about#about-me", "about"],
  ["footnote", "/about#footnote", "the footnote"],
  ["fun-fact", "/about#fun-fact", "the fun fact"],
  ["about-this-site", "/about#about-this-site", "about this site"],
  ["internal-links", "/contents#internal-links", "internal links"],
  ["external-links", "/contents#external-links", "external links"],
  ["social-media", "/contents#social-media", "social media"],
  ["emails", "/contents#emails", "email addresses"],
] as const;

export default function LegacyHomeFragments() {
  return destinations.map(([fragment, href, label]) => (
    <aside key={fragment} id={fragment} className={styles.legacyNotice}>
      <p>This section now has its own page.</p>
      <a href={href}>Continue to {label} →</a>
    </aside>
  ));
}
