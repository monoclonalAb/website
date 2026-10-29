// What the two functions share: api/comments.mjs (the comments) and
// api/subscribe.mjs (the list for emails about new posts). The database, the
// form a reader sends, sending an email, and the redirect that answers it. Vercel doesn't make a
// function of a file in api/ whose name starts with _, so this one is only
// ever imported.
//
// Both keep their data in Upstash Redis, which takes commands over HTTPS. Every
// key starts with COMMENTS_PREFIX: empty in production, "preview:" on preview
// deployments and laptops, so tests never mix with the real thing.

const MAX_BODY = 64 * 1024; // 4,000 characters of emoji, percent-encoded, still fit
const MAX_FIELDS = 10;
const CONTROL = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g; // all but tab and newline

// A form that can't be saved. The reason goes to the log, not the reader.
export class NotSent extends Error {
  name = "NotSent";
}

export const key = (name) => (process.env.COMMENTS_PREFIX ?? "") + name;

export function setting(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} isn't set`);
  return value;
}

// Runs one Redis command, like ["LLEN", "pending"], and returns its result.
// Reads use the read-only token, so a bug in them can't change anything.
export async function redis(command, write = false) {
  const token = setting(write ? "KV_REST_API_TOKEN" : "KV_REST_API_READ_ONLY_TOKEN");
  const response = await fetch(setting("KV_REST_API_URL"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`the database answered ${response.status}`);
  return (await response.json()).result;
}

// Runs several commands together or not at all, and returns their results.
export async function transaction(commands) {
  const response = await fetch(`${setting("KV_REST_API_URL")}/multi-exec`, {
    method: "POST",
    headers: { Authorization: `Bearer ${setting("KV_REST_API_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`the database answered ${response.status}`);
  return (await response.json()).map((answer) => answer.result);
}

// What went wrong, for the log: a missing setting's name, a service's status,
// or why it couldn't be reached. Never a token.
export const why = (error) => `${error}${error?.cause ? ` (${error.cause})` : ""}`;

// A field's text with Windows line breaks made plain and control characters gone.
export const clean = (value) => value.replace(/\r\n?/g, "\n").replace(CONTROL, "").trim();

// Lengths count characters, not UTF-16 units, so an emoji counts as one.
export const length = (text) => [...text].length;

// Something that looks like an email address: what the form's type="email"
// lets through, give or take.
export const isEmail = (text) => length(text) >= 3 && length(text) <= 254 && text.includes("@") && !/\s/.test(text);

// Sends one email through Resend (resend.com), as its HTTPS API takes it. On a
// laptop without RESEND_API_KEY, it's printed in the terminal instead.
export async function sendEmail(email) {
  if (!process.env.RESEND_API_KEY && !process.env.VERCEL) {
    console.log(`make serve: no RESEND_API_KEY in .env.local, so here's the email:\n\n${email.text}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${setting("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(email),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    // Resend's error has a name, like validation_error; its message can hold the address.
    const name = await response.json().then((error) => error.name, () => "");
    throw new Error(`Resend answered ${response.status} ${name}`);
  }
}

export function redirect(location) {
  return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
}

// The fields of a form the browser sent as a plain HTML POST, checked for
// size, type and number before anything reads them.
export async function readForm(request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY) throw new NotSent(`a body of ${declared} bytes`);
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (type !== "application/x-www-form-urlencoded") throw new NotSent(`a body of ${type || "no type"}`);
  const bytes = await request.arrayBuffer();
  if (!(bytes.byteLength > 0 && bytes.byteLength <= MAX_BODY)) throw new NotSent(`a body of ${bytes.byteLength} bytes`);
  const body = new TextDecoder().decode(bytes);
  if (body.split("&").length > MAX_FIELDS) throw new NotSent(`more than ${MAX_FIELDS} fields`);
  const form = new URLSearchParams(body);
  return (name) => form.get(name) ?? "";
}
