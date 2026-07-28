import Navbar from "@/components/Navbar";

/**
 * Shared page chrome: the sticky navbar plus the centred 650px `.content`
 * column. Used by the standalone /leetcode route and by the home page (which
 * renders the splash hero first, then wraps its scroll sections in this).
 * Nested under the root layout, so it must NOT render <html>/<body>.
 */
export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="content">{children}</div>
    </>
  );
}
