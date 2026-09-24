import Contents from "../_sections/Contents";
import ReadingPage from "@/components/ReadingPage";
import { readingMetadata } from "../shared-metadata";

export const metadata = readingMetadata(
  "Contents",
  "/contents",
  "A directory of every main page on Eric Zheng’s website, plus social profiles and email addresses.",
);

export default function ContentsPage() {
  return (
    <ReadingPage page="contents">
      <Contents />
    </ReadingPage>
  );
}
