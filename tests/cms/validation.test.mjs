import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { documentSchema, readDocument } from "../../cms/content/document.ts";
import { metadataSchema } from "../../cms/content/metadata.ts";
import { snapshotSchema } from "../../cms/content/contracts.ts";

const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
const document = fixture("document-v1");
const metadata = fixture("leetcode-metadata-v1");

// Initial compatibility fixture, not an editor/database/renderer round-trip.
// Keep it unchanged when adding future versions and test explicit migrations.
test("v1 ProseMirror envelope parses losslessly, including empty textblocks", () => {
  assert.deepEqual(documentSchema.parse(document), document);
  assert.deepEqual(readDocument(document), { ok: true, document });
  assert.deepEqual(
    documentSchema.parse(JSON.parse(JSON.stringify(document))),
    document,
  );
});

test("unsupported versions are rejected with their original payload intact", () => {
  for (const schema_version of [0, 2, "1", null]) {
    const input = { ...document, schema_version, future_data: { keep: true } };
    const before = structuredClone(input);
    const result = readDocument(input);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "unsupported_version");
    assert.strictEqual(result.original, input);
    assert.deepEqual(input, before);
  }
});

test("later blocks are rejected, never filtered from the document", () => {
  for (const type of [
    "bulletList",
    "orderedList",
    "blockquote",
    "codeBlock",
    "image",
    "callout",
    "table",
    "math",
    "footnote",
    "codeTabs",
    "complexity",
    "diff",
    "unknown",
  ]) {
    const input = structuredClone(document);
    input.doc.content.splice(1, 0, { type, attrs: { future: "preserve me" } });
    const before = structuredClone(input);
    const result = readDocument(input);
    assert.equal(result.ok, false, type);
    assert.equal(result.reason, "invalid_or_unsupported_content");
    assert.strictEqual(result.original, input);
    assert.deepEqual(input, before);
  }
});

test("strict at every node/attribute level; no unsafe marks or coercion", () => {
  const malformed = [
    null,
    {},
    { ...document, extra: true },
    { ...document, doc: { ...document.doc, attrs: {} } },
    { schema_version: 1, doc: { type: "doc", content: [] } },
  ];
  const blocks = [
    { type: "paragraph", attrs: { html: "<script>" } },
    { type: "paragraph", content: [{ type: "text", text: "" }] },
    { type: "paragraph", content: [{ type: "text", text: 42 }] },
    { type: "paragraph", content: [{ type: "hardBreak" }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "link",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }],
    },
    { type: "paragraph", content: [{ type: "paragraph" }] },
    ...[1, 5, 6, "2", null].map((level) => ({
      type: "heading",
      attrs: { level },
    })),
    { type: "heading" },
    { type: "heading", attrs: { level: 2, id: "not-supported-yet" } },
  ];
  for (const block of blocks)
    malformed.push({
      schema_version: 1,
      doc: { type: "doc", content: [block] },
    });
  for (const input of malformed)
    assert.equal(documentSchema.safeParse(input).success, false);
});

test("bounded documents reject oversized blocks and aggregate text", () => {
  const paragraph = (text) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  });
  const wrap = (content) => ({
    schema_version: 1,
    doc: { type: "doc", content },
  });
  assert.equal(
    documentSchema.safeParse(wrap([paragraph("x".repeat(100_001))])).success,
    false,
  );
  assert.equal(
    documentSchema.safeParse(wrap(Array(2_001).fill({ type: "paragraph" })))
      .success,
    false,
  );
  assert.equal(
    documentSchema.safeParse(
      wrap(Array(11).fill(paragraph("x".repeat(100_000)))),
    ).success,
    false,
  );
});

test("collection metadata matches the plan's labelled Leetcode specimen", () => {
  assert.deepEqual(metadataSchema.parse(metadata), metadata);
  assert.deepEqual(
    metadataSchema.parse({
      schema_version: 1,
      collection: "blog",
      title: "Test fixture only",
      date: "2024-02-29",
    }),
    {
      schema_version: 1,
      collection: "blog",
      title: "Test fixture only",
      date: "2024-02-29",
    },
  );
  assert.equal(
    metadataSchema.safeParse({ ...metadata, collection: "blog" }).success,
    false,
  );
  for (const key of Object.keys(metadata)) {
    const input = { ...metadata };
    delete input[key];
    assert.equal(metadataSchema.safeParse(input).success, false, key);
  }
});

test("metadata rejects unsupported versions/collections, impossible dates and malformed fields", () => {
  const changes = [
    { schema_version: 2 },
    { schema_version: "1" },
    { collection: "changelog" },
    { number: "2429" },
    { number: 0 },
    { number: 2.5 },
    { difficulty: "medium" },
    { date: "2025-02-29" },
    { date: "2025-04-31" },
    { date: "2025-01-15T00:00:00Z" },
    { title: "  " },
    { language: "" },
    { time_complexity: null },
    { space_complexity: " " },
    { learnings: "one" },
    { learnings: [""] },
    { future_field: "do not strip" },
  ];
  for (const change of changes) {
    const input = { ...metadata, ...change };
    const original = structuredClone(input);
    assert.equal(
      metadataSchema.safeParse(input).success,
      false,
      JSON.stringify(change),
    );
    assert.deepEqual(input, original);
  }
});

test("a snapshot keeps body and metadata together, rejecting not-yet-supported media", () => {
  const snapshot = { schema_version: 1, body: document, metadata, media: [] };
  assert.deepEqual(snapshotSchema.parse(snapshot), snapshot);
  for (const change of [
    { schema_version: 2 },
    { media: [{ id: "future", alt: "retain this" }] },
    { secret: "never exported" },
  ]) {
    assert.equal(
      snapshotSchema.safeParse({ ...snapshot, ...change }).success,
      false,
    );
  }
});
