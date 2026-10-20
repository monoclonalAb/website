"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Newer entries push older ones on to later pages, so a saved link like
 * /changelog#changelog-2025-01-09 can open a page that no longer has that entry.
 * The browser never sends the #… part to the server, so only the page can
 * follow it: this sends the link on to the page the entry is on now.
 * Without JavaScript the link stays on this page.
 */
export default function MovedEntry({
  elsewhere,
}: {
  /** The anchor of every entry on another page, and its address now. */
  elsewhere: Record<string, string>;
}) {
  const router = useRouter();
  useEffect(() => {
    const url = elsewhere[decodeURIComponent(location.hash.slice(1))];
    if (url) router.replace(url);
  }, [elsewhere, router]);
  return null;
}
