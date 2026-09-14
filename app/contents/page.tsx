import Contents from "../_sections/Contents";
import ReadingPage from "@/components/ReadingPage";
import { readingMetadata } from "../shared-metadata";

export const metadata = readingMetadata(
  "Contents",
  "/contents",
  "Useful links, Leetcode notes, profiles and email addresses for Eric Zheng.",
);

export default function ContentsPage() {
  return (
    <ReadingPage page="contents">
      <Contents />
    </ReadingPage>
  );
}
