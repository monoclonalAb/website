import Changelog from "../_sections/Changelog";
import ReadingPage from "@/components/ReadingPage";
import { readingMetadata } from "../shared-metadata";

export const metadata = readingMetadata(
  "Changelog",
  "/changelog",
  "Updates to Eric Zheng's personal website. Subscribe to the changelog with RSS.",
);

export default function ChangelogPage() {
  return (
    <ReadingPage page="changelog">
      <Changelog />
    </ReadingPage>
  );
}
