import "server-only";
import { cache } from "react";
import {
  loadPost,
  loadPostSummaries,
  loadWritingAssets,
  type Collection,
} from "../../lib/content/posts";

const includeDrafts = () => process.env.NODE_ENV === "development";
// Request-scoped only: refreshes always read fresh source and asset references.
export const publishedWriting = cache(() => loadPostSummaries());
export const writingCollection = cache((collection: Collection) =>
  loadPostSummaries({ collection, includeDrafts: includeDrafts() }),
);
// Metadata and body share the same selected post within a render pass.
export const writingPost = cache((collection: Collection, slug: string) =>
  loadPost(collection, slug, { includeDrafts: includeDrafts() }),
);
export const writingAssets = cache((collection?: Collection) =>
  loadWritingAssets({ collection, includeDrafts: includeDrafts() }),
);
