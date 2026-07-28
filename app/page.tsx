import type { Metadata } from "next";
import HomePage from "./HomePage";
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
 * The whole site on one scroll: the interactive splash hero, then the shared
 * chrome (sticky navbar + centred content column) wrapping every prose section,
 * tiled into full-height panels. Scrolling is the browser's own — CSS scroll-snap
 * aligns each tile and `scroll-behavior: smooth` eases the anchor jumps (both in
 * app/globals.css); there is no scroll library and no JS scroll handler.
 * <HomePage/> is the only client island; the navbar and sections are server-rendered.
 */
export default function Home() {
  return (
    <>
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
    </>
  );
}
