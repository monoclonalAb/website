import Blog from "../_sections/Blog";
import ReadingPage from "@/components/ReadingPage";
import { readingMetadata } from "../shared-metadata";

export const metadata = readingMetadata(
  "Blog",
  "/blog",
  "A place for Eric Zheng's thoughts on interesting topics. Writing coming soon.",
);

export default function BlogPage() {
  return (
    <ReadingPage page="blog">
      <Blog />
    </ReadingPage>
  );
}
