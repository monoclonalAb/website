/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogPage() {
  return (
    <>
      <h1 id="blog">
        blog<span>:</span>
      </h1>
      <p>
        place for me to put my thoughts on <b>interesting topics</b>! (group
        theory)
      </p>
      <p>
        also if there is not enough writing for you to read (probably isn't),
        please look at this <Link href="/leetcode">leetcode</Link> page
        instead...
      </p>
      {/* Empty state — leaves room for a future web-based editor / post feed. */}
      <div className="sidebar">
        <p>
          <i>posts coming soon — the writing pipeline is being rebuilt.</i>
        </p>
      </div>
    </>
  );
}
