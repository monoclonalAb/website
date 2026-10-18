import type { NextConfig } from "next";

// Old static-site URLs (ericzheng.nz/*.html) keep working.
const redirects = [
  ["/blog.html", "/blog"],
  ["/leetcode.html", "/leetcode"],
  ["/changelog.html", "/changelog"],
  ["/blog/group_theory.html", "/blog/group-theory"],
  [
    "/blog/uncompetitively_competing_in_competitive_programming.html",
    "/blog/uncompetitively-competing-in-competitive-programming",
  ],
  [
    "/blog/sightseeing_the_sea_of_c\\+\\+_1.html",
    "/blog/sightseeing-the-sea-of-cpp-1",
  ],
  ["/leetcode/:date(\\d{4}-\\d{2}-\\d{2}).html", "/leetcode/:date"],
  ["/images/eric_photo_2.jpg", "/photos/parable-house.jpg"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return redirects.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
