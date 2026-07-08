import type { Metadata } from "next";
import HomePage from "./HomePage";

export const metadata: Metadata = {
  // Exact "Eric Zheng" (the root template would otherwise append "| Eric Zheng").
  title: { absolute: "Eric Zheng" },
};

export default function Home() {
  return <HomePage />;
}
