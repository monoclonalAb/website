import BlogIndex, { blogIndexMetadata } from "./BlogIndex";

export const metadata = blogIndexMetadata(1);

export default function BlogPage() {
  return <BlogIndex page={1} />;
}
