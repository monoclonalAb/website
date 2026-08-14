import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";
import { OPEN_GRAPH_BASE, TWITTER_BASE } from "../shared-metadata";

const DESCRIPTION =
  "Eric Zheng's solutions to the daily Leetcode question, grouped and posted as " +
  "he works through them.";

export const metadata: Metadata = {
  title: "Leetcode",
  // Without these the page inherits the root's description and og:title, so it
  // would present itself as the home page everywhere off-site.
  description: DESCRIPTION,
  alternates: { canonical: "/leetcode" },
  // Both blocks respread the shared base: setting either one at all discards
  // every field the root layout put in it. See app/shared-metadata.ts.
  openGraph: {
    ...OPEN_GRAPH_BASE,
    url: "/leetcode",
    title: "Leetcode | Eric Zheng",
    description: DESCRIPTION,
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Leetcode | Eric Zheng",
    description: DESCRIPTION,
  },
};

export default function LeetcodePage() {
  return (
    <SiteChrome>
      <h1 id="leetcode">
        leetcode<span>:</span>
      </h1>
      <p>
        for me to conveniently <b>group</b> and post my solutions to the daily
        leetcode question... hopefully I do not end up missing any... right...
      </p>
      {/* Empty state — leaves room for a future web-based editor / solution log. */}
      <div className="sidebar">
        <p>
          <i>daily solutions coming soon.</i>
        </p>
      </div>
    </SiteChrome>
  );
}
