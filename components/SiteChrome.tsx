import SiteCrumb from "@/components/SiteCrumb";
import SiteRail from "@/components/SiteRail";

/**
 * Shared page chrome: the floating crumb and rail plus the centred 650px `.content`
 * column. Used by the standalone /leetcode route and by the home page (which renders the
 * splash hero first, then wraps its scroll sections in this).
 *
 * There is no bar. Both chrome pieces are `position: fixed` and sit outside `.content`,
 * which matters twice over: the column can be pushed aside for the rail's disclosure
 * without dragging them along, and a transform on it would otherwise become their
 * containing block.
 *
 * Nested under the root layout, so it must NOT render <html>/<body>.
 */
export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteCrumb />
      <SiteRail />
      <div className="content">{children}</div>
    </>
  );
}
