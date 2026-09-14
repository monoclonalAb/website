import About from "../_sections/About";
import ReadingPage from "@/components/ReadingPage";
import { readingMetadata } from "../shared-metadata";

export const metadata = readingMetadata(
  "About",
  "/about",
  "About Eric Zheng, an undergraduate studying Mathematics and Computer Science in Auckland, New Zealand.",
);

export default function AboutPage() {
  return (
    <ReadingPage page="about">
      <About />
    </ReadingPage>
  );
}
