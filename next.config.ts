import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // File-based static generation needs no custom cache configuration.
  // In particular, empty collections work without synthetic generateStaticParams.
  // Public reading routes are canonical pages, not redirects to home fragments.
};

export default nextConfig;
