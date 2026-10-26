// /api/comments: the blog's comments, as a Vercel Function. JavaScript on
// Vercel's Node.js runtime, with Node's built-ins only, so there's nothing to
// install and no package.json. It ends in .mjs so Vercel runs it as it is,
// rather than compiling it to CommonJS. The design and the reasons are in
// docs/exec-plans/active/2026-10-25-blog-comments.md.
//
//   GET  /api/comments?post=<slug>  the post's approved comments, as JSON
//   POST /api/comments              a comment from the form under a post. It
//                                   waits in the pending list until Eric
//                                   approves it with make comments.
//
// The comments live in Upstash Redis (api/_shared.mjs, which this function
// shares with api/subscribe.mjs). Every key starts with COMMENTS_PREFIX: empty
// in production, "preview:" on preview deployments and laptops, so test
// comments never mix with real ones.
//
//   pending          comments waiting for approval, oldest first. Each is a
//                    JSON object: id, post, name, email, text, time (UTC).
//   comments:<slug>  a post's approved comments, oldest first: id, name, text,
//                    time, and eric (true when Eric wrote it). Never an email:
//                    anyone can read this list.
import { randomBytes } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { NotSent, clean, isEmail, key, length, readForm, redirect, redis, why } from "./_shared.mjs";

const SLUG = /^[A-Za-z0-9_-]+$/; // build.sh's rule for a post's folder
const PUBLIC = ["id", "name", "text", "time", "eric"]; // what a GET may show
const MAX_PENDING = 100; // so a flood can't fill the database
const NOT_SENT = "/comment-not-sent";

// The function runs from the project's root, and vercel.json puts the posts in
// its bundle.
function isPost(slug) {
  return SLUG.test(slug) && Boolean(statSync(`content/blog/${slug}/index.md`, { throwIfNoEntry: false })?.isFile());
}

function reply(status, body) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  return new Response(body, { status, headers });
}

async function list(request) {
  const post = new URL(request.url).searchParams.get("post") ?? "";
  try {
    const stored = isPost(post) ? await redis(["LRANGE", key(`comments:${post}`), "0", "-1"]) : [];
    const comments = stored.map((item) => {
      const comment = JSON.parse(item);
      return Object.fromEntries(PUBLIC.filter((k) => Object.hasOwn(comment, k)).map((k) => [k, comment[k]]));
    });
    return reply(200, JSON.stringify(comments));
  } catch (error) {
    console.error(`comments: couldn't read ${JSON.stringify(post.slice(0, 80))}: ${why(error)}`);
    const failed = { error: "couldn't load the comments" };
    if (process.env.VERCEL_ENV !== "production") failed.why = why(error); // previews and laptops only
    return reply(502, JSON.stringify(failed) + "\n");
  }
}

async function send(request) {
  try {
    return redirect(`/blog/${await save(request)}#comment-sent`);
  } catch (error) {
    // NotSent, or the database is down
    console.error(`comments: not sent: ${why(error)}`);
    return redirect(NOT_SENT);
  }
}

// Checks the form and adds the comment to pending; returns the post's slug.
async function save(request) {
  const field = await readForm(request);
  const post = field("post");
  if (!isPost(post)) throw new NotSent(`no post called ${JSON.stringify(post.slice(0, 80))}`);
  if (field("website")) return post; // only bots fill the hidden field: look sent, save nothing
  const name = clean(field("name")).replace(/\s+/g, " ");
  const email = clean(field("email"));
  const text = clean(field("text"));
  if (!(length(name) >= 1 && length(name) <= 80)) throw new NotSent(`a name of ${length(name)} characters`);
  if (!isEmail(email)) throw new NotSent("an email that isn't one");
  if (!(length(text) >= 1 && length(text) <= 4000)) throw new NotSent(`a comment of ${length(text)} characters`);
  if ((await redis(["LLEN", key("pending")])) >= MAX_PENDING) {
    throw new NotSent(`${MAX_PENDING} comments already pending`);
  }
  const comment = {
    id: randomBytes(6).toString("hex"),
    post,
    name,
    email,
    text,
    time: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  };
  await redis(["RPUSH", key("pending"), JSON.stringify(comment)], true);
  return post;
}

const handler = {
  fetch(request) {
    if (request.method === "GET") return list(request);
    if (request.method === "POST") return send(request);
    return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });
  },
};
export default handler;

// make serve (scripts/serve.sh) runs this file with node: the built site in
// out/, this function and api/subscribe.mjs together on http://localhost:4000,
// so a post's comments and sign-up work on a laptop. It reads the database's address and tokens from
// .env.local, and keeps to the preview: keys unless COMMENTS_PREFIX says
// otherwise. The browser keeps no copies of pages, so a reload after a rebuild
// always shows the new one.
const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".ics": "text/calendar; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

// The file in out/ that Vercel would send for a path: /blog/x is
// out/blog/x/index.html. Nothing outside out/.
function find(site, pathname) {
  try {
    let file = join(site, decodeURIComponent(pathname));
    if (file !== site && !file.startsWith(site + sep)) return null;
    if (statSync(file, { throwIfNoEntry: false })?.isDirectory()) file = join(file, "index.html");
    return statSync(file, { throwIfNoEntry: false })?.isFile() ? file : null;
  } catch {
    return null; // a malformed path
  }
}

async function answer(site, req) {
  const url = new URL(req.url, "http://localhost:4000");
  if (url.pathname === "/api/comments" || url.pathname === "/api/subscribe") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks);
    const request = new Request(url, { method: req.method, headers: req.headers, body });
    if (url.pathname === "/api/comments") return handler.fetch(request);
    return (await import("./subscribe.mjs")).default.fetch(request);
  }
  if (req.method !== "GET" && req.method !== "HEAD") return new Response(null, { status: 405 });
  const file = find(site, url.pathname);
  const shown = file ?? join(site, "404.html");
  const headers = { "Content-Type": TYPES[extname(shown)] ?? "application/octet-stream", "Cache-Control": "no-store" };
  return new Response(readFileSync(shown), { status: file ? 200 : 404, headers });
}

function serve() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const [name, ...value] = line.trim().split("=");
      if (value.join("=") && !name.startsWith("#")) process.env[name] ??= value.join("=").replace(/^"+|"+$/g, "");
    }
  } catch {
    console.log("No .env.local, so comments won't load; docs/writing.md says how to get one.");
  }
  process.env.COMMENTS_PREFIX ??= "preview:";
  const site = resolve("out");
  createServer(async (req, res) => {
    // Quiet, like make serve was; a comment that isn't sent still says why.
    const response = await answer(site, req).catch((error) => {
      console.error(`make serve: ${req.url}: ${error}`);
      return new Response(null, { status: 500 });
    });
    const body = Buffer.from(await response.arrayBuffer());
    res.writeHead(response.status, { ...Object.fromEntries(response.headers), "Content-Length": body.length });
    res.end(req.method === "HEAD" ? undefined : body);
  })
    .on("error", (error) => {
      console.error(`make serve: can't show the site on port 4000: ${error.message}`); // another make serve?
      process.exit(1);
    })
    .listen(4000, "127.0.0.1");
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) serve();
