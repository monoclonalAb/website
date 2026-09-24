import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // File-based static generation needs no custom cache configuration.
  // In particular, empty collections work without synthetic generateStaticParams.
  // Public reading routes are canonical pages, not redirects to home fragments.
  async redirects() {
    return [
      ...["blog", "leetcode", "changelog"].map((page) => ({
        source: `/${page}.html`,
        destination: `/${page}`,
        permanent: true,
      })),
      {
        source: "/blog/group_theory.html",
        destination: "/blog/group-theory",
        permanent: true,
      },
      {
        source:
          "/blog/uncompetitively_competing_in_competitive_programming.html",
        destination:
          "/blog/uncompetitively-competing-in-competitive-programming",
        permanent: true,
      },
      {
        source: "/blog/sightseeing_the_sea_of_c\\+\\+_1.html",
        destination: "/blog/sightseeing-the-sea-of-cpp-1",
        permanent: true,
      },
      {
        source: "/leetcode/:date(\\d{4}-\\d{2}-\\d{2}).html",
        destination: "/leetcode/:date",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
