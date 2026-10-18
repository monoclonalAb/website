import { redirect } from "next/navigation";
import { jumpHref } from "@/lib/posts";

// Without JavaScript, the page number in components/PageJump.tsx submits ?page=N here.
export function GET(request: Request) {
  redirect(jumpHref("blog", request));
}
