import type { Metadata } from "next";
import Splash from "./Splash";

export const metadata: Metadata = {
  // Exact "Eric Zheng" (the root template would otherwise append "| Eric Zheng").
  title: { absolute: "Eric Zheng" },
};

export default function Home() {
  return <Splash />;
}
