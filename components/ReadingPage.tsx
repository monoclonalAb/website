import type { ReactNode } from "react";
import SiteHeader, { type ReadingPageId } from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ScrollWaves from "./ScrollWaves";

export default function ReadingPage({
  page,
  children,
}: {
  page: ReadingPageId;
  children: ReactNode;
}) {
  return (
    <div id={`${page}-top`} className="reading-column">
      <a className="skip-link" href={`#${page}`}>
        Skip to content
      </a>
      <SiteHeader currentPage={page} />
      <main id={page} tabIndex={-1} className="standalone">
        {children}
      </main>
      <SiteFooter page={page} />
      <ScrollWaves />
      <ScrollWaves side="left" />
    </div>
  );
}
