import type { Metadata, Viewport } from "next";
import "./globals.css";
import { helvetica, eiko, baskerville, inconsolata, menlo } from "./fonts";

export const metadata: Metadata = {
  title: {
    default: "Eric Zheng",
    template: "%s | Eric Zheng",
  },
  description: "Eric Zheng's personal website",
  authors: [{ name: "Eric Zheng" }],
};

// Zoom is deliberately left unrestricted (WCAG 1.4.4): the home page now carries
// all of the site's prose, so pinch-to-zoom has to keep working. Only the two
// defaults Next would emit anyway are declared.
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
      className={`${helvetica.variable} ${eiko.variable} ${baskerville.variable} ${inconsolata.variable} ${menlo.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
