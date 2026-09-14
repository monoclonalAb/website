#!/usr/bin/env node
import { loadPosts } from "../lib/content/posts.ts";
try {
  const posts = await loadPosts({ includeDrafts: true });
  console.log(
    `content:check passed (${posts.filter((post) => !post.draft).length} published, ${posts.filter((post) => post.draft).length} drafts; all rendered and validated)`,
  );
} catch (error) {
  console.error(`content:check failed\n${error.message}`);
  process.exitCode = 1;
}
