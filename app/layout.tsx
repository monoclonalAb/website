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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
