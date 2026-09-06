import assert from "node:assert/strict";
import test from "node:test";
import {
  canChangeSlug,
  checkExpectedVersion,
  postStateSchema,
  publicationCommandSchema,
  publicationReceiptSchema,
  publicationRetry,
} from "../../cms/content/contracts.ts";

const postId = "00000000-0000-4000-8000-000000000001";
const revisionId = "00000000-0000-4000-8000-000000000002";
const command = {
  operation_id: "00000000-0000-4000-8000-000000000003",
  post_id: postId,
  kind: "publish",
  expected_version: 3,
  expected_draft_version: 2,
};
const draft = {
  schema_version: 1,
  body: {
    schema_version: 1,
    doc: { type: "doc", content: [{ type: "paragraph" }] },
  },
  metadata: {
    schema_version: 1,
    collection: "blog",
    title: "Contract fixture only",
    date: "2026-09-05",
  },
  media: [],
};
const post = {
  id: postId,
  collection: "blog",
  slug: "contract-fixture",
  version: 3,
  draft_version: 2,
  draft,
  first_published_at: null,
  published_at: null,
  published_revision_id: null,
};
const time = "2026-09-05T00:00:00Z";
const receipt = {
  command,
  request_hash: "a".repeat(64),
  result_version: 4,
  revision_id: revisionId,
  invalidation_tags: ["fixture:blog", "fixture:detail"],
  sync: { status: "pending", attempts: 0, next_attempt_at: time },
};

test("publication requires both the current post and draft version", () => {
  assert.deepEqual(publicationCommandSchema.parse(command), command);
  assert.equal(
    checkExpectedVersion(postStateSchema.parse(post), command),
    true,
  );
  for (const change of [
    { expected_version: 2 },
    { expected_draft_version: 1 },
    { post_id: revisionId },
  ]) {
    assert.equal(checkExpectedVersion(post, { ...command, ...change }), false);
  }
  // Same draft after another publication decision still conflicts.
  assert.equal(checkExpectedVersion({ ...post, version: 4 }, command), false);
  for (const change of [
    { expected_version: "3" },
    { expected_version: 0 },
    { expected_version: 2_147_483_647 },
    { expected_draft_version: 4 },
    { overwrite: true },
  ]) {
    assert.equal(
      publicationCommandSchema.safeParse({ ...command, ...change }).success,
      false,
    );
  }
});

test("first publication locks the slug permanently, including after unpublish", () => {
  assert.equal(canChangeSlug(post, "new-slug"), true);
  const live = {
    ...post,
    first_published_at: time,
    published_at: time,
    published_revision_id: revisionId,
  };
  const unpublished = {
    ...live,
    published_at: null,
    published_revision_id: null,
  };
  for (const state of [live, unpublished]) {
    assert.equal(postStateSchema.safeParse(state).success, true);
    assert.equal(canChangeSlug(state, "new-slug"), false);
    assert.equal(canChangeSlug(state, post.slug), true);
  }
  for (const slug of [
    "",
    "../escape",
    "has/slash",
    "x?draft",
    "x#anchor",
    "x%2Fy",
    "Space Here",
    "-x",
    "x_underscore",
  ]) {
    assert.equal(canChangeSlug(post, slug), false);
  }
});

test("post state rejects partial visibility, wrong collections and inverted versions", () => {
  for (const change of [
    { published_at: time },
    { published_revision_id: revisionId },
    { published_at: time, published_revision_id: revisionId },
    {
      published_at: time,
      published_revision_id: revisionId,
      first_published_at: "2026-09-06T00:00:00Z",
    },
    { collection: "leetcode" },
    { version: 1 },
    { draft_version: 0 },
  ])
    assert.equal(
      postStateSchema.safeParse({ ...post, ...change }).success,
      false,
    );
});

test("a committed publication is not success while cache synchronization is pending", () => {
  assert.deepEqual(publicationReceiptSchema.parse(receipt), receipt);
  assert.equal(
    publicationRetry(receipt, command, receipt.request_hash).status,
    "sync_pending",
  );
  const failedAttempt = {
    ...receipt,
    sync: { status: "pending", attempts: 1, next_attempt_at: time },
  };
  assert.equal(publicationReceiptSchema.safeParse(failedAttempt).success, true);
  assert.equal(
    publicationRetry(failedAttempt, command, receipt.request_hash).status,
    "sync_pending",
  );
  const synced = publicationReceiptSchema.parse({
    ...receipt,
    sync: { status: "synced", attempts: 2, synced_at: time },
  });
  const replay = publicationRetry(synced, command, receipt.request_hash);
  assert.equal(replay.status, "complete");
  assert.strictEqual(replay.receipt, synced);
  assert.equal(replay.receipt.result_version, 4); // A receipt, not a new mutation.
});

test("operation IDs cannot be reused with a changed request", () => {
  for (const change of [
    { kind: "unpublish" },
    { expected_version: 4 },
    { expected_draft_version: 1 },
    { post_id: revisionId },
    { operation_id: revisionId },
  ])
    assert.equal(
      publicationRetry(receipt, { ...command, ...change }, receipt.request_hash)
        .status,
      "idempotency_conflict",
    );
  assert.equal(
    publicationRetry(receipt, command, "b".repeat(64)).status,
    "idempotency_conflict",
  );
});

test("receipts model unpublish, exact version advancement and explicit retry state", () => {
  assert.equal(
    publicationReceiptSchema.safeParse({
      ...receipt,
      command: { ...command, kind: "unpublish" },
      revision_id: null,
    }).success,
    true,
  );
  for (const change of [
    { result_version: 5 },
    { revision_id: null },
    { invalidation_tags: [] },
    { request_hash: "unhashed request" },
    { sync: { status: "synced", attempts: 0, synced_at: time } },
    { sync: { status: "pending", attempts: 1 } },
  ])
    assert.equal(
      publicationReceiptSchema.safeParse({ ...receipt, ...change }).success,
      false,
    );
});
