---
owner: Eric Zheng
status: accepted
last_verified: 2026-09-06
---

# ADR-0002: dynamic content model with a hosted single-user studio

- **Status:** accepted
- **Date:** 2026-09-05
- **Owners:** Eric Zheng
- **Supersedes:** the static-only content stance recorded in the product brief non-goals and the architecture static content boundary, for the staged scope below
- **Superseded by:** none

## Context

The site currently ships as a fully static build: content is hand-authored JSX or typed TypeScript collections, there is no database, API, authentication, or runtime fetch, and the Blog and Leetcode surfaces are intentional placeholders whose authoring workflow was undecided. This repository has not yet replaced the deployed site: as of 2026-09-05, `ericzheng.nz` is still the previous hand-built static site on GitHub Pages, holding three blog posts and 223 daily Leetcode solutions as Pandoc-generated HTML at `/blog/<slug>` and `/leetcode/YYYY-MM-DD`, with clean URLs and no redirects. The content and its URLs exist; only the authoring workflow does not.

Eric now wants to write blog posts and Leetcode solutions regularly, from any device, with a comfortable rich editor (code blocks, multi-language code tabs, images, callouts, math), and to publish or fix content instantly without a Git commit and rebuild in the loop. A local-only, Git-backed authoring tool was considered and rejected by the owner: authoring must not be tied to one machine, and the publish path must not require a build.

That requirement cannot be met by the static model. It requires runtime content reads, a hosted authoring surface, and therefore real authentication — all currently listed as non-goals that an accepted decision record may change.

## Decision drivers

- Author and edit from any device, including mobile, with only a browser.
- Publish and correct content in seconds without a redeploy.
- Keep a single deployment: no separate CMS service to run or pay for.
- Keep the editor private to one person with minimal attack surface.
- Preserve the home page's motion architecture, tile/outline/redirect contracts, accessibility behavior, and personality untouched.
- Keep content in a typed, validated, portable format that the site's own renderer consumes.

## Approval and implementation

Eric explicitly accepted this direction on 2026-09-05, as recorded in [the plan's decision log](../plans/active/2026-09-05-dynamic-cms-studio.md#decision-log), then approved the reviewed block direction (“i approve of the current direction”) and requested the step-2 implementation foundation in a separate session. This record's status was reconciled to **accepted before code changes**, correcting obsolete wording that made acceptance depend on implementation. The hosting, passkey, Postgres/Drizzle, content-policy and sequencing choices are settled; do not ask for approval again without cause.

Per [the ADR process](README.md), acceptance authorizes staged implementation, not shipment or external operations. Hosted provisioning, secrets, non-test database writes and deployment still require separate authorization. The early authenticated publishing checkpoint and later security, hosted five-second invalidation and database/media recovery gates remain mandatory. Current [architecture](../architecture.md) and [setup](../development.md) describe what has actually landed; public routes remain static until their explicit later slices.

### Provider selection — 2026-09-06 (superseded later that day)

Eric subsequently chose **Supabase instead of Neon**, and requested the plan be updated before another Pi agent continues. The original decision allowed Neon or equivalent Postgres; this selects Supabase Postgres without changing Drizzle, the SQL contracts, Vercel-style application hosting or single-owner passkey authentication. It does **not** select Supabase Auth, Storage, browser Data API access or Edge Functions. The [plan's provider-transition slice](../plans/active/2026-09-05-dynamic-cms-studio.md#supabase-provider-transition-slice--next-bounded-step-2) replaces the not-yet-wired Neon adapter with a `pg`/verified-TLS foundation, accounts for pooler/session constraints, and requires verifying that Supabase's alternate APIs/grants cannot expose private CMS/auth data before hosted use. Repository implementation/local tests are authorized; hosted provisioning/connections, production secrets, non-test writes and deployment remain separate. No backup tier, retention or RPO/RTO is inferred from the provider choice.

### Return to Neon Free — 2026-09-06 (current)

Eric then confirmed **Vercel deployment**, explicitly required **no spending**, and requested “rewrite the plan so its back to neon” followed by implementation in a separate Pi pane. **Neon Free Postgres is now selected**, superseding the Supabase provider direction above. Its normal [scale-to-zero](https://neon.com/docs/introduction/scale-to-zero) automatically wakes on the next connection/query, unlike Supabase's free inactivity pause; cold starts, [free-tier quotas](https://neon.com/pricing), outages and a short restore window still need explicit handling. Automatic waking is not guaranteed uptime or independent recovery.

The [bounded Neon return slice](../plans/active/2026-09-05-dynamic-cms-studio.md#neon-return-slice--next-bounded-step-2) replaced the unused Supabase factory/configuration/tests while preserving shared transactions, local pg, all four migrations and the accepted passkey design. It reuses pg/verified TLS for Vercel Node and adds no provider SDK. Its direct/pooled/TLS/channel-binding evidence is offline only; local PostgreSQL remains separate from hosted Neon proof. Neon Auth, Data API, Storage and Functions are **not** selected. No paid plan/add-on/automatic upgrade, hosted provisioning/connection, production secret, non-test write, hosted backup CI or deployment was authorized or performed. Independent free backups, media recovery, retention/RPO/RTO and a measured restore drill remain separate setup/release gates; the proposed daily/30-day/24-hour policy is not yet configured or proven.

## Decision

Turn the site into a dynamic Next.js application with a hosted, auth-gated authoring studio inside the same deployment.

- **Content storage:** Neon Free Postgres (latest provider selection on 2026-09-06 as recorded above) accessed with Drizzle ORM. One `posts` table serves both collections (`blog`, `leetcode`); each post has a versioned working draft and a nullable reference to an immutable published revision. Revisions capture body, per-collection metadata, and media references/alt text together; `media` records support uploads. Migrations live in the repository.
- **Content format:** ProseMirror/Tiptap JSON block documents validated with shared zod schemas, with explicit `schema_version` on documents, revisions, and exports. A server-side `BlockRenderer` maps blocks to JSX; Shiki highlights code. Old-document fixtures and lossless migrations accompany schema changes; unsupported content is preserved and explicitly rejected, never silently stripped. No MDX/Markdown compiler pipeline.
- **Public rendering:** `/blog/[slug]` and `/leetcode/[slug]` are Server Components reading only published snapshots through tagged caches under `cacheComponents: true`, an app-wide mode change. Select `'use cache'` versus `'use cache: remote'` against the actual hosting handler and prove shared invalidation; default serverless memory is not that proof. Publish, explicit republish, and unpublish server actions call `updateTag`; other invalidation paths use two-argument `revalidateTag(tag, profile)` with a profile appropriate to the required freshness, never the deprecated single-argument form. The release target is new public state on fresh anonymous detail/metadata/index/home requests within 5 seconds of successful mutation acknowledgment, not push updates to open tabs. Cache misses can incur database latency. No build-time database reads or `generateStaticParams`; `pnpm build` needs no `DATABASE_URL`, and runtime requests populate the cache.
- **Indexes and failure isolation:** home `#blog` shows five recent published posts and links to paginated `/blog`, the URL the deployed site already serves (the repository's never-shipped 308 for it is removed); `/leetcode` is paginated the same way. Home retains IDs/order/static section markup and never reads `searchParams`. Public database reads sit behind `connection()` and Suspense; studio reads/mutations stay request-time and outside public caches. Five-row geometry is reserved for full, short, empty, loading, and failed reads, because the scroll engine does not observe resizes. An explicit “posts unavailable” state must preserve the rest of home during database failure, not masquerade as an empty collection. The sitemap remains database-free with only `/`, `/leetcode`, and `/blog`.
- **Studio and publication:** the auth-gated `/studio` provides a library, Tiptap editor, real-renderer preview, autosave, revisions, uploads, and publish/unpublish/share flows. Autosave updates only the working draft; explicit save or publish creates a durable revision. Publish/republish atomically validates the draft version and selects a complete public snapshot; unpublish removes public visibility without destroying draft/history. Restore changes only the draft, and changes to live content require explicit republish. Version-check mutations across tabs/devices, retain conflicted local edits, and make retries idempotent. Since database commit and cache invalidation are not atomic, persist retryable pending-sync state and do not report publication success before required invalidations succeed. The plan specifies failure/retry evidence.
- **Content policies:** slugs remain editable until first publication and permanently locked afterwards, including after unpublish; keep a first-publication marker separately from nullable `published_at`. Scheduling remains deferred. Draft share tokens are per-post, non-expiring, stored hashed, and revocable by regeneration; draft/preview reads require authorization and stay out of shared caches, logs containing secrets, search indexes, and referrers. Revocation blocks future requests, not downloaded copies. Math uses server-side KaTeX and self-hosted CSS/fonts when added in v1.1, with no client math JavaScript.
- **Authentication and environments:** single-user passkeys, no passwords/identity provider/signup. `proxy.ts` cheaply redirects protected anonymous pages; layouts and every authoring read/mutation verify sessions, and upload handlers enforce auth plus CSRF. Login and token-gated enrollment are explicit anonymous exceptions. All enrollment requires a set, matching `STUDIO_ENROLL_TOKEN`; normal additional-credential enrollment also requires the owner session, while bootstrap/lost-session recovery is the session exception. Preserve set/enroll/unset and its platform redeploy cost, and support credential/session revocation. Use a maintained WebAuthn verifier and server-controlled short-lived, single-use challenges with origin/RP ID/user-verification checks. Allow only the configured production origin or explicit server-controlled localhost development/test with isolated Postgres; preview/other deployments 404 studio and its backing endpoints. Environment guards apply to operations, not just pages, and cannot rely on a supplied Host header. Detailed negative tests and the localhost test-origin policy are in the plan.
- **Media:** object storage (for example Vercel Blob or R2) with private draft delivery, required contextual alt text, and authorized, short-lived presigned uploads restricted by key/type/size; validate completed objects before attachment. Published immutable images use `next/image`. Unpublished-only assets must not leak through object URLs or the image optimizer; draft edits cannot overwrite published assets in place. Unpublish cannot retract already-public cached/downloaded bytes.
- **Recovery:** before real content or the first release, demonstrate automated database backups, media recovery, and an isolated restore of drafts, published revisions, history, and image bytes/references. Versioned export/import with a checksummed media manifest proves portability separately. Record retention, recovery targets, procedure, and measured drill results; a JSON dump or deferred media-backup debt is not sufficient.
- **Hosting and cost:** Eric confirmed Vercel for the application deployment; Neon Free supplies Postgres, with media/backup storage still to be selected. Target eligible free Vercel usage; no paid features, billable overages or automatic upgrades without a new owner decision. Environment variables and platform services become deployment dependencies. The $0 requirement does not waive security, independent recovery or hosted-cache proof; report an unmet free-tier constraint rather than spending or promising an unsupported guarantee.

The home document's section contracts (tile IDs, order, outline rows, fragment links), the changelog's hand-authored TypeScript source, and `/changelog.xml` are unchanged by this decision. The legacy redirect set changes once: `/blog` becomes a real route while `/about`, `/contents`, and `/changelog` stay permanent redirects. The `#blog` tile's content becomes a cached database read; its markup contract does not.

## Alternatives considered

### Keep the static model with a local-only, Git-backed studio

Preserves every current invariant with zero runtime dependencies, and content lands in Git. Rejected by the owner: authoring would be chained to one machine and every publish would wait on a build.

### Hosted headless CMS (Sanity, Contentful, Payload Cloud)

Mature editors and hosted infrastructure, but content lives in a third-party platform with its own cost, lock-in, query API, and editor that cannot easily match this site's renderer or personality. Overweight for one author.

### Git-backed hosted CMS (Keystatic, Decap via GitHub API)

Enables remote editing while keeping content in Git, but publishing still rides the build pipeline, media bloats the repository, and mobile authoring is second-class. Fails the instant-publish driver.

### Separate self-hosted CMS service (Payload, Strapi)

Full control, but a second application to deploy, secure, upgrade, and pay for, plus cross-service preview complexity. A single-deployment studio covers the same need with less operation.

### Markdown/MDX files as the content format

Human-readable diffs, but round-tripping a block editor through Markdown is lossy, and it adds a compiler and plugin chain. JSON blocks are the editor's native format and extend the existing typed-collection pattern.

## Consequences

### Positive

- Writing, editing, and typo fixes happen from any browser in seconds.
- One deployment serves readers and the author; preview uses the production renderer.
- Content is typed, zod-validated, and portable; revisions provide history and restore.
- Blog and Leetcode stop being placeholders without touching the home page contracts.

### Negative

- The site gains runtime dependencies: database, object storage, secrets, and platform services. `pnpm build` alone no longer produces the whole product.
- `cacheComponents: true` changes caching semantics for every route, including the home page and its motion stack, not only the new post routes. It also replaces route segment configs (`dynamic`, `revalidate`, `fetchCache`), so the changelog feed's `force-static` export is migrated with it. The home e2e suite and the feed test must pass unchanged under the new mode before any studio work lands.
- `app/sitemap.ts` stays a static list of `/`, `/leetcode`, and `/blog`; a database read there would execute at build time. Posts are discovered through the paginated index.
- The block set ships in two tiers so the site is never half-migrated: v1 (paragraph, heading, list, quote, code, image, callout) reaches a minimum shippable milestone; v1.1 (table, math, footnote, codeTabs, complexity, diff) is additive. `codeTabs` is the one public-page block that needs interactivity and is a recorded exception to the no-avoidable-client-JS stance, or is built CSS-only.
- The repository's `/blog` → `/#blog` 308 (in code since 2026-07-29) was never deployed, so making `/blog` the index route has no cached-redirect fallout; it keeps the URL readers already use. The redirect contract in `scripts/check-site-contracts.mjs`, the e2e redirect test, and the product/architecture records change with it.
- Launching this site replaces a live site with real content and indexed URLs. The owner chose not to import the existing posts and solutions; they serve only as design specimens and as the reference for the Leetcode metadata shape. The new site launches with empty collections, and the old per-post URLs (`/blog/<slug>`, `/leetcode/YYYY-MM-DD`) stop resolving. A bulk redirect to the new indexes is a possible follow-up, not part of this decision.
- Showing recent posts on the home tile means `/` is no longer fully static: its shell prerenders and the recent-posts list is a request-time cached read. Local development and e2e therefore need a database or seed even for the home page. The site gains one more canonical page.
- `pnpm build` needs no `DATABASE_URL` because nothing reads the database at build time; `pnpm test:e2e` does, so CI must provision and seed Postgres.
- WebAuthn credentials are bound to an origin, so the studio is production-only and cannot be exercised on per-branch preview deployments; the editor is tested on `localhost` and in production.
- Scheduling is not in v1; wanting it later means choosing between a lazy `published_at <= now()` filter with timed cache expiry and a platform cron.
- Cache hits can hide serverless Postgres cold starts; readers on cache misses and studio users can still feel them. Shared caching may add platform cost/latency. Freshness, invalidation failures, and database outages require evidence on the chosen hosting setup, not only local tests.
- The product invariant "fast and private by default … no runtime data dependency" is narrowed to reader-facing privacy (no tracking) and cached performance. Record the transition on acceptance; update product/architecture descriptions as implementation lands.
- An authentication surface exists and must stay small: passkeys only, one owner, guarded reads/mutations, no signup. Enrollment/recovery, sessions, bearer previews, and private media still require explicit negative security coverage.
- Content now lives in a database, not Git: backups, media recovery, export/import, and schema evolution become release responsibilities. Draft/public separation and optimistic concurrency add necessary complexity even for one author using multiple tabs/devices.
- E2E testing needs a seeded database or test double, increasing CI complexity.

### Follow-up

- Use [the dynamic CMS studio plan](../plans/active/2026-09-05-dynamic-cms-studio.md) for implementation sequencing. The ADR and block-direction approval gates are cleared; later engineering and release gates remain.
- Approval and transition scope are recorded above. As implementation lands, update the product brief, architecture map, development/setup, testing strategy, quality scorecard, and debt register to match actual behavior.
- Ship versioned content export/import and a media manifest, and pass the database/media restore gate before real content or the first release. Keep secret-bearing backups outside the repository; document owner-operated recovery and pending-invalidation retries.
- Design the block sheet in Penpot (page `09 · Studio`) first. Then prove a minimal authenticated edit/save/publish/anonymous-read/unpublish slice before the broader renderer/editor. Studio chrome/flow design waits for the engineering checkpoints, rather than running alongside its prerequisites. Keep the v1/v1.1 split; the early proof is not a release waiver for security, hosted-cache, or recovery evidence.
- The owner decisions on index location, build-time reads, scheduling, enrollment, previews, content policies, and sequencing were recorded in the plan's decision log on 2026-09-05 and are reflected in the Decision section above. Candidate follow-ups: scheduling, slug redirects, share-link expiry.

## Validation

These are future acceptance checks, not evidence of current capabilities. Record actual results in the execution plan as each slice lands.

- Drizzle schema and migrations exist in the repository and match the deployed database.
- The early slice proves passkey → edit/save → publish → anonymous read → private edit/restore → republish → unpublish before the full editor is built.
- Autosave/restore cannot change published body/metadata/media; stale cross-device writes are rejected without lost local edits, publication retries are idempotent, and unpublish retains history and slug lock.
- Studio/backing endpoints allow configured production and explicit localhost test/development only; negative tests cover enrollment/recovery, challenges, expired/revoked sessions, unauthorized drafts, revoked share tokens, and upload/private-media access.
- Independent anonymous requests see publish/republish/unpublish on detail/metadata/index/home within 5 seconds of successful acknowledgment, without a redeploy or cache-busting URLs. Test warm/cold caches, cached 404s, and partial invalidation failure locally and on the actual deployed cache handler; record cross-instance evidence or keep the release gate blocked.
- Database failure has bounded, explicit states; home geometry/navigation remain usable, and invalidated unpublished content cannot reappear through stale fallback.
- Existing contracts, home e2e, and RSS tests pass unchanged at the isolated Cache Components checkpoint. The later `/blog` route change updates only its intended redirect expectations; final checks retain all home/outline/motion/feed invariants.
- Versioned export/import and old-schema fixtures preserve documents and media references; an isolated database/media backup restore verifies drafts, publications, revisions, and image bytes against documented recovery targets before release.
- Actual editor/database/renderer round-trips pass for each block as introduced; zod and the renderer reject malformed/unsafe content. Sitemap stays static and `pnpm validate` passes without `DATABASE_URL`; full seeded e2e and relevant manual checks pass.
- Explicit acceptance precedes implementation. Product, architecture, setup, testing, quality, and debt records match landed behavior, and the plan records remaining v1.1 work separately from the v1 release evidence.
