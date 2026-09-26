import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Serves images that sit beside the Markdown in content/ (see lib/markdown.ts).
const contentDir = path.join(process.cwd(), "content");
const types: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export const dynamic = "force-static";

export async function generateStaticParams() {
  const files = await readdir(contentDir, { recursive: true });
  return files
    .filter((file) => types[path.extname(file).toLowerCase()])
    .map((file) => ({ path: file.split(path.sep) }));
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const file = path.join(contentDir, ...(await params).path);
  const type = types[path.extname(file).toLowerCase()];
  if (!type || !file.startsWith(contentDir + path.sep))
    return new Response("Not found", { status: 404 });
  try {
    return new Response(new Uint8Array(await readFile(file)), {
      headers: { "Content-Type": type, "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
