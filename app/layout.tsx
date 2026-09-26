import type { Metadata } from "next";
import localFont from "next/font/local";
import { feeds, openGraph } from "@/lib/metadata";
import "./globals.css";

const helvetica = localFont({
  variable: "--font-helvetica",
  fallback: ["Arial", "sans-serif"],
  src: [
    { path: "./fonts/helvetica/Helvetica.woff2", weight: "400" },
    { path: "./fonts/helvetica/Helvetica-Bold.woff2", weight: "700" },
  ],
});
const eiko = localFont({
  variable: "--font-eiko",
  fallback: ["Georgia", "serif"],
  src: "./fonts/eiko/PPEiko-Medium.woff2",
  weight: "500",
});
const firaCode = localFont({
  variable: "--font-fira-code",
  fallback: ["ui-monospace", "monospace"],
  src: "./fonts/fira-code/FiraCode-Regular.woff2",
  weight: "400",
});

const description =
  "Personal site of Eric Zheng, an undergraduate studying Mathematics and " +
  "Computer Science in Auckland, New Zealand.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ericzheng.nz"),
  title: { default: "Eric Zheng", template: "%s | Eric Zheng" },
  description,
  authors: [{ name: "Eric Zheng" }],
  alternates: { canonical: "/", types: feeds },
  openGraph: { ...openGraph, url: "/", title: "Eric Zheng", description },
  twitter: { card: "summary_large_image", title: "Eric Zheng", description },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-NZ"
      className={`${helvetica.variable} ${eiko.variable} ${firaCode.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
