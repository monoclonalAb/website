import type { Metadata } from "next";
import ReadingPage from "@/components/ReadingPage";
import PostList from "@/components/PostList";
import { writingCollection } from "@/app/_content/writing";
import { readingMetadata } from "../shared-metadata";

const DESCRIPTION =
  "Eric Zheng's solutions to the daily Leetcode question, grouped and posted as " +
  "he works through them.";

export const metadata: Metadata = readingMetadata(
  "Leetcode",
  "/leetcode",
  DESCRIPTION,
);

export default async function LeetcodePage() {
  const posts = await writingCollection("leetcode");
  return (
    <ReadingPage page="leetcode">
      <h1>
        leetcode<span>:</span>
      </h1>
      <p>
        for me to conveniently <b>group</b> and post my solutions to the daily
        leetcode question... hopefully I do not end up missing any... right...
      </p>
      {posts.length ? (
        <PostList posts={posts} />
      ) : (
        <p className="muted">
          <i>daily solutions coming soon.</i>
        </p>
      )}
    </ReadingPage>
  );
}
