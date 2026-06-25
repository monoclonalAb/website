import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leetcode",
};

export default function LeetcodePage() {
  return (
    <>
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
    </>
  );
}
