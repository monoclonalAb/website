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
        place for me to put my thoughts on interesting topics! (group theory)
      </p>
      {posts.length ? (
        <PostList posts={posts} />
      ) : (
        <p className="muted">
          <i>turns out this bit requires writing-</i>
        </p>
      )}
      <p className="rss-subscribe">
        subscribe with <a href="/writing.xml">rss</a>
      </p>
    </>
  );
}
