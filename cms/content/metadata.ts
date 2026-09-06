import { z } from "zod";

export const METADATA_SCHEMA_VERSION = 1;
export const collectionSchema = z.enum(["blog", "leetcode"]);

// Validate without trimming/normalizing away authored text.
const requiredText = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((value) => value.trim().length > 0, "Must not be blank");
const commonMetadata = {
  schema_version: z.literal(METADATA_SCHEMA_VERSION),
  title: requiredText(300),
  date: z.iso.date(),
};

export const blogMetadataSchema = z.strictObject({
  ...commonMetadata,
  collection: z.literal("blog"),
});

// Field inventory comes from the plan's verified 2429 Minimize XOR specimen.
// Values live only in a labelled test fixture; this module publishes no content.
export const leetcodeMetadataSchema = z.strictObject({
  ...commonMetadata,
  collection: z.literal("leetcode"),
  number: z.number().int().positive().max(2_147_483_647),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  language: requiredText(80),
  time_complexity: requiredText(500),
  space_complexity: requiredText(500),
  learnings: z.array(requiredText(5_000)).max(100),
});

export const metadataSchema = z.discriminatedUnion("collection", [
  blogMetadataSchema,
  leetcodeMetadataSchema,
]);
export type PostMetadata = z.infer<typeof metadataSchema>;
