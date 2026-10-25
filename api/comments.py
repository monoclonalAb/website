# /api/comments, for now only a test that Vercel runs a Python function in
# this project: step 1 of docs/exec-plans/active/2026-10-25-blog-comments.md.
# A GET answers "comments: ok" and the Python version. Step 4 replaces this
# with the comments function. Python's standard library only.
import sys
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = f"comments: ok (python {sys.version.split()[0]})\n".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
