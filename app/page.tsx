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
 * The whole site on one scroll: the interactive splash hero, then the shared
 * chrome (sticky navbar + centred content column) wrapping every prose section,
 * tiled into full-height panels you glide between via <SmoothScroll/> (Lenis).
 * <HomePage/> and <SmoothScroll/> are the client islands; the navbar and sections
 * stay server-rendered, passed through <SmoothScroll/> as children.
 */
export default function Home() {
  return (
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
  );
}
