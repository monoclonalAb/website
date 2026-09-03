import type { Metadata } from "next";
import HomePage from "./HomePage";
import SmoothScroll from "./SmoothScroll";
import SiteChrome from "@/components/SiteChrome";
import About from "./_sections/About";
import Blog from "./_sections/Blog";
import Contents from "./_sections/Contents";
import Changelog from "./_sections/Changelog";

export const metadata: Metadata = {
  // Exact "Eric Zheng" (the root template would otherwise append "| Eric Zheng").
  title: { absolute: "Eric Zheng" },
};

/**
 * Schema.org Person. "Eric Zheng" is a shared name — the About section links to
 * a different one at ericzheng.org — so `sameAs` is the load-bearing field here:
 * it is what ties this site to these specific profiles rather than to a namesake.
 * Only accounts Eric owns belong in it (the Instagram fan page is not his).
 */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Eric Zheng",
  url: "https://ericzheng.nz",
  image: "https://ericzheng.nz/images/eric_photo_2.jpg",
  jobTitle: "Undergraduate student",
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "University of Auckland",
  },
  knowsAbout: ["Mathematics", "Computer Science"],
  sameAs: [
    "https://github.com/monoclonalAb",
    "https://www.linkedin.com/in/eric-zheng-nz/",
    "https://www.kaggle.com/monoclonal",
  ],
};

/**
 * The whole site on one scroll: the interactive splash hero, then the shared
 * chrome (fixed crumb/rail + centred content column) wrapping every prose section,
 * tiled into full-height panels you glide between via <SmoothScroll/> (Lenis).
 * <HomePage/> and <SmoothScroll/> own the page-level client behavior; SiteChrome's
 * shell and the prose sections stay server-rendered while the crumb and rail keep
 * their own narrow client boundaries.
 */
export default function Home() {
  return (
    <>
      {/* Outside <SmoothScroll/> deliberately: its reduced-motion and Lenis
          branches must render identical DOM, so nothing conditional may gain a
          sibling. A JSON-LD script is display:none per the UA stylesheet, so it
          costs the tile layout nothing. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <SmoothScroll>
        <HomePage />
        <SiteChrome>
          <section id="about">
            <About />
          </section>
          <section id="blog">
            <Blog />
          </section>
          <section id="contents">
            <Contents />
          </section>
          <section id="changelog">
            <Changelog />
          </section>
        </SiteChrome>
      </SmoothScroll>
    </>
  );
}
