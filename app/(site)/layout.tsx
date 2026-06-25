import Navbar from "@/components/Navbar";

/**
 * Shared chrome for every page except the home splash: the navbar plus the
 * centred 650px `.content` column. Nested under the root layout, so it must
 * NOT render <html>/<body>.
 */
export default function SiteLayout({
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
