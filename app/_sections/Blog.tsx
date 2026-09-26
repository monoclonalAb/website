import Link from "next/link";
import { writingCollection } from "@/app/_content/writing";
import PostList from "@/components/PostList";

export default async function Blog() {
  const posts = await writingCollection("blog");
  return (
    <>
      <h1>
        blog<span>:</span>
      </h1>
      <p>
        place for me to put my thoughts on <b>interesting topics</b>! (group
        theory)
      </p>
      <p>
        also if there is not enough writing for you to read (probably
        isn&apos;t), please look at this <Link href="/leetcode">leetcode</Link>{" "}
        page instead...
      </p>
      {posts.length ? (
        <PostList posts={posts} />
      ) : (
        <p className="muted">
          <i>turns out this bit requires writing-</i>
        </p>
      )}
    </>
  );
}
