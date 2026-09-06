import { z } from "zod";

export const DOCUMENT_SCHEMA_VERSION = 1;

const textNodeSchema = z.strictObject({
  type: z.literal("text"),
  text: z.string().min(1).max(100_000),
});

// Native ProseMirror JSON omits content for an empty textblock. No defaults or
// coercion: parsing must not rewrite a document or silently drop an extension.
const inlineContent = z.array(textNodeSchema).max(2_000).optional();
export const paragraphSchema = z.strictObject({
  type: z.literal("paragraph"),
  content: inlineContent,
});
export const headingSchema = z.strictObject({
  type: z.literal("heading"),
  // The post title supplies h1; the approved prose sheet uses h2–h4.
  attrs: z.strictObject({
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  }),
  content: inlineContent,
});

export const documentSchema = z
  .strictObject({
    schema_version: z.literal(DOCUMENT_SCHEMA_VERSION),
    // Keep the version envelope outside editor.getJSON()/setContent() JSON.
    doc: z.strictObject({
      type: z.literal("doc"),
      content: z
        .array(z.discriminatedUnion("type", [paragraphSchema, headingSchema]))
        .min(1)
        .max(2_000),
    }),
  })
  .refine(
    (value) =>
      value.doc.content.reduce(
        (total, block) =>
          total +
          (block.content?.reduce((sum, node) => sum + node.text.length, 0) ??
            0),
        0,
      ) <= 1_000_000,
    "Document exceeds the one-million-character limit",
  );

export type ContentDocument = z.infer<typeof documentSchema>;

/** Rejected input is retained for recovery, never substituted with an empty doc.
 * Do not log this result: it can contain private draft content.
 * Marks, URLs, HTML and all later blocks are unsupported, not sanitized here.
 */
export function readDocument(input: unknown) {
  if (
    typeof input === "object" &&
    input !== null &&
    "schema_version" in input &&
    input.schema_version !== DOCUMENT_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      reason: "unsupported_version",
      original: input,
    } as const;
  }
  const result = documentSchema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      reason: "invalid_or_unsupported_content",
      original: input,
      issues: result.error.issues,
    } as const;
  }
  return { ok: true, document: result.data } as const;
}
