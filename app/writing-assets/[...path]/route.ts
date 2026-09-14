import { writing } from "@/app/_content/writing";
import { readAsset } from "@/lib/content/markdown";

export const dynamic = "force-static";
// The allowlist below, not arbitrary filesystem paths, controls asset access.
export const dynamicParams = true;
export async function generateStaticParams() {
  const paths = new Set(
    (await writing()).flatMap((post) => post.assets.map((asset) => asset.path)),
  );
  return [...paths].map((path) => ({ path: path.split("/") }));
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const path = (await params).path.join("/");
  const asset = (await writing())
    .flatMap((post) => post.assets)
    .find((asset) => asset.path === path);
  if (!asset)
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  return new Response(new Uint8Array(await readAsset(asset)), {
    headers: {
      "Content-Type": asset.type,
      "X-Content-Type-Options": "nosniff",
      // Filenames aren't content hashes: redeployments may change the bytes.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
