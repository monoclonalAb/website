import type { Metadata } from "next";
import HomePage from "./HomePage";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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

/** One server-rendered document. Scrolling and disclosures belong to the browser. */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <HomePage />
      <div className="reading-column">
        <SiteHeader home />
        <main className="content">
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
        </main>
        <SiteFooter home />
      </div>
    </>
  );
}
