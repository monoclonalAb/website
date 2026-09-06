import { z } from "zod";
import { documentSchema } from "./document.ts";
import { collectionSchema, metadataSchema } from "./metadata.ts";

export const SNAPSHOT_SCHEMA_VERSION = 1;
export const versionSchema = z.number().int().min(1).max(2_147_483_647);
export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const snapshotSchema = z.strictObject({
  schema_version: z.literal(SNAPSHOT_SCHEMA_VERSION),
  body: documentSchema,
  metadata: metadataSchema,
  // No executable image blocks yet. Reject references rather than lose them.
  // The media slice must version this contract and add contextual alt/captions.
  media: z.array(z.never()).length(0),
});
export type PostSnapshot = z.infer<typeof snapshotSchema>;

export const postStateSchema = z
  .strictObject({
    id: z.uuid(),
    collection: collectionSchema,
    slug: slugSchema,
    // All authoring decisions advance version; only draft changes advance
    // draft_version. Unpublish must conflict even when the body did not change.
    version: versionSchema,
    draft_version: versionSchema,
    draft: snapshotSchema,
    first_published_at: z.iso.datetime().nullable(),
    published_at: z.iso.datetime().nullable(),
    published_revision_id: z.uuid().nullable(),
  })
  .superRefine((post, ctx) => {
    if (post.draft.metadata.collection !== post.collection) {
      ctx.addIssue({
        code: "custom",
        path: ["draft", "metadata", "collection"],
        message: "Collection mismatch",
      });
    }
    if (post.draft_version > post.version) {
      ctx.addIssue({
        code: "custom",
        path: ["draft_version"],
        message: "Draft version exceeds post version",
      });
    }
    if (
      (post.published_at === null) !==
      (post.published_revision_id === null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Publication timestamp and revision must agree",
      });
    }
    if (
      post.published_at !== null &&
      (post.first_published_at === null ||
        Date.parse(post.first_published_at) > Date.parse(post.published_at))
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Publication requires a permanent first-publication marker",
      });
    }
  });
export type PostState = z.infer<typeof postStateSchema>;

// A request boundary, not a database transaction or an authorization check.
export const publicationCommandSchema = z
  .strictObject({
    operation_id: z.uuid(),
    post_id: z.uuid(),
    kind: z.enum(["publish", "unpublish"]),
    expected_version: versionSchema.max(2_147_483_646),
    expected_draft_version: versionSchema,
  })
  .refine(
    (command) => command.expected_draft_version <= command.expected_version,
    "Draft version exceeds expected post version",
  );
export type PublicationCommand = z.infer<typeof publicationCommandSchema>;

const pendingSyncSchema = z.strictObject({
  status: z.literal("pending"),
  attempts: z.number().int().nonnegative(),
  next_attempt_at: z.iso.datetime(),
});
const completedSyncSchema = z.strictObject({
  status: z.literal("synced"),
  attempts: z.number().int().positive(),
  synced_at: z.iso.datetime(),
});
export const publicationReceiptSchema = z
  .strictObject({
    command: publicationCommandSchema,
    // Server-computed SHA-256 of a canonical validated request; never client-trusted.
    request_hash: z.string().regex(/^[a-f0-9]{64}$/),
    result_version: versionSchema,
    revision_id: z.uuid().nullable(),
    invalidation_tags: z.array(z.string().min(1).max(256)).min(1).max(128),
    sync: z.discriminatedUnion("status", [
      pendingSyncSchema,
      completedSyncSchema,
    ]),
  })
  .superRefine((receipt, ctx) => {
    if (receipt.result_version !== receipt.command.expected_version + 1) {
      ctx.addIssue({
        code: "custom",
        message: "Result version must advance exactly once",
      });
    }
    if (
      (receipt.command.kind === "unpublish") !==
      (receipt.revision_id === null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Publish selects a revision; unpublish clears it",
      });
    }
  });
export type PublicationReceipt = z.infer<typeof publicationReceiptSchema>;

/** Advisory pure checks. The same conditions MUST be checked under the write
 * transaction/conditional UPDATE; a preflight followed by an unchecked write races.
 */
export function checkExpectedVersion(
  post: PostState,
  command: PublicationCommand,
) {
  return (
    post.id === command.post_id &&
    post.version === command.expected_version &&
    post.draft_version === command.expected_draft_version
  );
}

export function canChangeSlug(post: PostState, slug: string) {
  return (
    slugSchema.safeParse(slug).success &&
    (post.first_published_at === null || post.slug === slug)
  );
}

/** Look up the operation ID BEFORE a new version check. A retry returns its old
 * receipt, never reapplies a DB mutation or rolls back a newer publication.
 * Pending invalidation is explicitly not a publication-success acknowledgment.
 */
export function publicationRetry(
  receipt: PublicationReceipt,
  command: PublicationCommand,
  requestHash: string,
) {
  const previous = receipt.command;
  if (
    receipt.request_hash !== requestHash ||
    previous.operation_id !== command.operation_id ||
    previous.post_id !== command.post_id ||
    previous.kind !== command.kind ||
    previous.expected_version !== command.expected_version ||
    previous.expected_draft_version !== command.expected_draft_version
  ) {
    return { status: "idempotency_conflict" } as const;
  }
  return {
    status: receipt.sync.status === "pending" ? "sync_pending" : "complete",
    receipt,
  } as const;
}
