# /api/comments: the blog's comments, as a Vercel Function. Python's standard
# library only, so there's nothing to install. The design and the reasons are
# in docs/exec-plans/active/2026-10-25-blog-comments.md.
#
#   GET  /api/comments?post=<slug>  the post's approved comments, as JSON
#   POST /api/comments              a comment from the form under a post. It
#                                   waits in the pending list until Eric
#                                   approves it with make comments.
#
# The comments live in Upstash Redis, which takes commands over HTTPS. Every
# key starts with COMMENTS_PREFIX: empty in production, "preview:" on preview
# deployments and laptops, so test comments never mix with real ones.
#
#   pending          comments waiting for approval, oldest first. Each is a
#                    JSON object: id, post, name, email, text, time (UTC).
#   comments:<slug>  a post's approved comments, oldest first: id, name, text,
#                    time, and eric (true when Eric wrote it). Never an email:
#                    anyone can read this list.
import json
import os
import re
import secrets
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

SLUG = re.compile(r"[A-Za-z0-9_-]+")  # build.sh's rule for a post's folder
CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")  # all but tab and newline
PUBLIC = ("id", "name", "text", "time", "eric")  # what a GET may show
MAX_BODY = 64 * 1024  # 4,000 characters of emoji, percent-encoded, still fit
MAX_PENDING = 100  # so a flood can't fill the database
NOT_SENT = "/comment-not-sent"


class NotSent(Exception):
    """A comment that can't be saved. The reason goes to the log, not the reader."""


def key(name):
    return os.environ.get("COMMENTS_PREFIX", "") + name


def redis(command, write=False):
    """Runs one Redis command, like ["LLEN", "pending"], and returns its result.
    Reads use the read-only token, so a bug in them can't change anything."""
    token = os.environ["KV_REST_API_TOKEN" if write else "KV_REST_API_READ_ONLY_TOKEN"]
    request = urllib.request.Request(
        os.environ["KV_REST_API_URL"],
        data=json.dumps(command).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        return json.load(response)["result"]


def is_post(slug):
    # The function runs from the project's root, and its bundle has content/.
    return bool(SLUG.fullmatch(slug)) and os.path.isfile(f"content/blog/{slug}/index.md")


def clean(value):
    """A field's text with Windows line breaks made plain and control characters gone."""
    return CONTROL.sub("", value.replace("\r\n", "\n").replace("\r", "\n")).strip()


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
        post = query.get("post", [""])[0]
        try:
            stored = redis(["LRANGE", key(f"comments:{post}"), "0", "-1"]) if is_post(post) else []
            comments = [{k: c[k] for k in PUBLIC if k in c} for c in map(json.loads, stored)]
        except Exception as error:
            self.log_message("comments: couldn't read %s: %r", post, error)
            return self.reply(502, b'{"error": "couldn\'t load the comments"}\n')
        self.reply(200, json.dumps(comments, ensure_ascii=False).encode())

    def do_POST(self):
        try:
            post = self.save()
        except Exception as error:  # NotSent, or the database is down
            self.log_message("comments: not sent: %r", error)
            return self.redirect(NOT_SENT)
        self.redirect(f"/blog/{post}#comment-sent")

    def save(self):
        """Checks the form and adds the comment to pending; returns the post's slug."""
        length = int(self.headers.get("Content-Length") or 0)
        if not 0 < length <= MAX_BODY:
            raise NotSent(f"a body of {length} bytes")
        if self.headers.get_content_type() != "application/x-www-form-urlencoded":
            raise NotSent(f"a body of {self.headers.get_content_type()}")
        body = self.rfile.read(length).decode("ascii", "replace")
        form = urllib.parse.parse_qs(body, keep_blank_values=True, max_num_fields=10)

        def field(name):
            return form.get(name, [""])[0]

        post = field("post")
        if not is_post(post):
            raise NotSent(f"no post called {post[:80]!r}")
        if field("website"):
            return post  # only bots fill the hidden field: look sent, save nothing
        name = " ".join(clean(field("name")).split())
        email = clean(field("email"))
        text = clean(field("text"))
        if not 1 <= len(name) <= 80:
            raise NotSent(f"a name of {len(name)} characters")
        if not (3 <= len(email) <= 254 and "@" in email and len(email.split()) == 1):
            raise NotSent("an email that isn't one")
        if not 1 <= len(text) <= 4000:
            raise NotSent(f"a comment of {len(text)} characters")
        if redis(["LLEN", key("pending")]) >= MAX_PENDING:
            raise NotSent(f"{MAX_PENDING} comments already pending")
        comment = {
            "id": secrets.token_hex(6),
            "post": post,
            "name": name,
            "email": email,
            "text": text,
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        redis(["RPUSH", key("pending"), json.dumps(comment, ensure_ascii=False)], write=True)
        return post

    def reply(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, location):
        self.send_response(303)
        self.send_header("Location", location)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", "0")
        self.end_headers()
