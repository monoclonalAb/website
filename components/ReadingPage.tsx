import type { ReactNode } from "react";
import SiteHeader, { type ReadingPageId } from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import ScrollWaves from "./ScrollWaves";

export default function ReadingPage({
  page,
  id = page,
  children,
}: {
  page: ReadingPageId;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div id={`${id}-top`} className="reading-column">
      <a className="skip-link" href={`#${id}`}>
        Skip to content
      </a>
      <SiteHeader currentPage={page} />
      <main id={id} tabIndex={-1} className="standalone">
        {children}
      </main>
      <SiteFooter page={id} />
      <ScrollWaves />
      <ScrollWaves side="left" />
    </div>
  );
}
