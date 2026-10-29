// /api/subscribe: the list of readers who get an email when Eric publishes a
// blog post, as a Vercel Function. Node's built-ins only, like
// api/comments.mjs, whose database it shares (api/_shared.mjs). The design
// and the reasons are in docs/exec-plans/active/2026-10-26-new-post-emails.md.
//
//   POST /api/subscribe                      the sign-up form on /blog and at
//        the end of each post. The address is sent a link to confirm, and the
//        reader goes to /check-your-email, whether or not it was on the list
//        already, so the page never tells anyone who is.
//   GET  /api/subscribe?confirm=<token>      the link in that email: puts the
//        address on the list, then /subscribed.
//   GET  /api/subscribe?unsubscribe=<token>  the link in every email: takes
//        the address off, then /unsubscribed.
//   POST /api/subscribe?unsubscribe=<token>  the same, from a mail app's own
//        unsubscribe button (RFC 8058).
// Anything that goes wrong ends on /not-subscribed.
//
// Emails go out through Resend (resend.com), from posts@ericzheng.nz with
// replies to Eric's Gmail, and their words are in emails/. This sends the
// confirm email; scripts/announce.sh (make announce) sends the posts, and
// api/comments.mjs tells Eric about each new comment. On a
// laptop without RESEND_API_KEY, the confirm email is printed in the terminal
// instead.
//
// The keys, each with COMMENTS_PREFIX in front (api/_shared.mjs):
//   subscribers          a hash from each address, in lower case, to its
//                        unsubscribe token and when it confirmed, as JSON.
//                        Never shown on the site: only make announce and
//                        make subscribers read it.
//   unconfirmed:<token>  an address waiting for its confirm click, gone after
//                        7 days.
//   asked:<hash>         set for a day once a confirm email has gone to an
//                        address, so it gets at most one a day. A hash, not
//                        the address.
//   confirms:<day>       how many confirm emails went out that day (UTC), so a
//                        flood of sign-ups can't use up the day's emails.
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { NotSent, clean, isEmail, key, readForm, redirect, redis, sendEmail, transaction, why } from "./_shared.mjs";

// Who the emails are from, and where replies go. scripts/announce.sh has the
// same two.
const FROM = "eric zheng <posts@ericzheng.nz>";
const REPLY_TO = "ericzheng.nz@gmail.com";
const CONFIRM_SUBJECT = "confirm: new posts from ericzheng.nz";
const DAY = 24 * 60 * 60; // seconds
const WEEK = 7 * DAY; // how long a confirm link works; emails/confirm.html says so
const MAX_CONFIRMS = 50; // a day: half of Resend's free 100, leaving the rest for posts and comments
const TOKEN = /^[0-9a-f]{32}$/;
const NOT_SUBSCRIBED = "/not-subscribed";

const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

// The address whose unsubscribe token this is, or null.
async function subscriberWith(token) {
  const all = await redis(["HGETALL", key("subscribers")]); // address, details, address, …
  for (let i = 0; i < all.length; i += 2) if (JSON.parse(all[i + 1]).token === token) return all[i];
  return null;
}

// The form: an address, and the hidden field only bots fill.
async function signUp(request, origin) {
  const field = await readForm(request);
  if (field("website")) return; // a bot: look done, send nothing
  const email = clean(field("email")).toLowerCase();
  if (!isEmail(email)) throw new NotSent("an email that isn't one");
  if (await redis(["HEXISTS", key("subscribers"), email])) return; // on the list already
  const asked = key(`asked:${createHash("sha256").update(email).digest("hex")}`);
  if ((await redis(["SET", asked, "1", "NX", "EX", String(DAY)], true)) !== "OK") return; // sent one today
  try {
    const day = key(`confirms:${now().slice(0, 10)}`);
    const [count] = await transaction([
      ["INCR", day],
      ["EXPIRE", day, String(2 * DAY)],
    ]);
    if (count > MAX_CONFIRMS) throw new NotSent(`${MAX_CONFIRMS} confirm emails already sent today`);
    const token = randomBytes(16).toString("hex");
    await redis(["SET", key(`unconfirmed:${token}`), JSON.stringify({ email, time: now() }), "EX", String(WEEK)], true);
    await sendConfirm(email, `${origin}/api/subscribe?confirm=${token}`);
  } catch (error) {
    await redis(["DEL", asked], true).catch(() => {}); // so they can try again
    throw error;
  }
}

// The confirm link: the address joins the list, keeping its old token if it
// was on it already. A second click finds it there.
async function confirm(token) {
  if (!TOKEN.test(token)) throw new NotSent("a confirm link that isn't one");
  const waiting = await redis(["GET", key(`unconfirmed:${token}`)]);
  if (!waiting) {
    if (await subscriberWith(token)) return;
    throw new NotSent("a confirm link that has run out");
  }
  const { email } = JSON.parse(waiting);
  await transaction([
    ["HSETNX", key("subscribers"), email, JSON.stringify({ token, since: now() })],
    ["DEL", key(`unconfirmed:${token}`)],
  ]);
}

// An unsubscribe link. One that's already been used does nothing.
async function unsubscribe(token) {
  if (!TOKEN.test(token)) throw new NotSent("an unsubscribe link that isn't one");
  const email = await subscriberWith(token);
  if (email) await redis(["HDEL", key("subscribers"), email], true);
}

async function sendConfirm(to, link) {
  const words = (file) => readFileSync(`emails/${file}`, "utf8").replaceAll("{{confirm}}", link);
  const email = {
    from: FROM,
    to: [to],
    reply_to: REPLY_TO,
    subject: CONFIRM_SUBJECT,
    html: words("confirm.html"),
    text: words("confirm.txt"),
  };
  await sendEmail(email);
}

const handler = {
  async fetch(request) {
    const url = new URL(request.url);
    const confirmToken = url.searchParams.get("confirm");
    const unsubscribeToken = url.searchParams.get("unsubscribe");
    try {
      if (request.method === "GET" && confirmToken !== null) {
        await confirm(confirmToken);
        return redirect("/subscribed");
      }
      if (unsubscribeToken !== null && (request.method === "GET" || request.method === "POST")) {
        await unsubscribe(unsubscribeToken);
        if (request.method === "POST") return new Response(null, { status: 200, headers: { "Cache-Control": "no-store" } });
        return redirect("/unsubscribed");
      }
      if (request.method === "POST") {
        await signUp(request, url.origin);
        return redirect("/check-your-email");
      }
      if (request.method === "GET") return redirect(NOT_SUBSCRIBED);
      return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });
    } catch (error) {
      // NotSent, or the database or Resend is down. Never the address.
      console.error(`subscribe: ${why(error)}`);
      return redirect(NOT_SUBSCRIBED);
    }
  },
};
export default handler;
