import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The former prose routes are now sections of the single-scroll home page.
  // Redirect their old URLs to the matching in-page anchor. (/leetcode stays a
  // real route, so it is intentionally excluded.)
  async redirects() {
    return ["about", "blog", "contents", "changelog"].map((s) => ({
      source: `/${s}`,
      destination: `/#${s}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
