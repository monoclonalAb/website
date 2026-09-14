import type { Metadata, Viewport } from "next";
import "./globals.css";
import { helvetica, eiko, baskerville, firaCode } from "./fonts";
import { OPEN_GRAPH_BASE, TWITTER_BASE } from "./shared-metadata";

const DESCRIPTION =
  "Personal site of Eric Zheng, an undergraduate studying Mathematics and " +
  "Computer Science in Auckland, New Zealand.";

export const metadata: Metadata = {
  // Every URL-based metadata field below is relative; without metadataBase that
  // is a build error, not a silent fallback.
  metadataBase: new URL("https://ericzheng.nz"),
  title: {
    default: "Eric Zheng",
    template: "%s | Eric Zheng",
  },
  description: DESCRIPTION,
  authors: [{ name: "Eric Zheng" }],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/changelog.xml" },
  },
  openGraph: {
    ...OPEN_GRAPH_BASE,
    url: "/",
    title: "Eric Zheng",
    description: DESCRIPTION,
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Eric Zheng",
    description: DESCRIPTION,
  },
};

// Zoom remains unrestricted (WCAG 1.4.4) on every page. Only the two defaults
// Next would emit anyway are declared.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-NZ"
      className={`${helvetica.variable} ${eiko.variable} ${baskerville.variable} ${firaCode.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
