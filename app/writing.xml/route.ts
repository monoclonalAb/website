import { publishedWriting } from "@/app/_content/writing";
import { writingFeed } from "@/lib/content/feed";

export const dynamic = "force-static";
export async function GET() {
  return new Response(writingFeed(await publishedWriting()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
