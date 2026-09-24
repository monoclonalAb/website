import { writingAssets } from "@/app/_content/writing";
import { readAsset } from "@/lib/content/markdown";

export const dynamic = "force-static";
// The allowlist below, not arbitrary filesystem paths, controls asset access.
export const dynamicParams = true;
export async function generateStaticParams() {
  return (await writingAssets()).map((asset) => ({
    path: asset.path.split("/"),
  }));
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  const path = segments.join("/");
  const collection = segments[0];
  // References cannot cross collections; still require an exact allowlist match.
  const asset =
    collection === "blog" || collection === "leetcode"
      ? (await writingAssets(collection)).find((asset) => asset.path === path)
      : undefined;
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
