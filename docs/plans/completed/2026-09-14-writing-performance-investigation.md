---
owner: Eric Zheng
status: completed
last_verified: 2026-09-14
---

# Investigate slow writing-page navigation

## Outcome and scope

Status: completed investigation; no application optimization implemented. Eric reported that Blog, Leetcode and their articles switch much more slowly than other pages. Acceptance was to reproduce that difference, isolate server/client costs, compare development with production, and recommend a bounded fix. Preserve all inherited uncommitted [archive migration](../active/2026-09-14-archive-migration.md) work. No content edits, dependencies, deployment, commit or restart of the user's server.

## Findings

### Render the entire archive before selecting anything

[`writingCollection`](../../../app/_content/writing.ts) calls `writing()` and only then filters by collection. `writingPost` searches that already-loaded collection. [`loadPosts`](../../../lib/content/posts.ts) reads, parses and fully renders both collections sequentially, including every code block and mathematical expression. Consequently, even the three-title Blog index renders226 articles and417 fenced blocks before returning anything. Indexes, static-parameter enumeration, feeds and sitemap need metadata, not rendered bodies.

React `cache` shares this work within one render pass; it does not preserve the result across requests. This matches the installed Next.js16.2.9 caching guide. First access to an article also runs the same expensive work in `generateStaticParams`: a clean dev server logged2.2–2.4s in parameter generation and another1.8–1.9s in application rendering. Warm requests spend only a few milliseconds in Next itself and roughly1.7–2.0s in application code, so compilation is not the main recurring delay.

The [`writing-assets` handler](../../../app/writing-assets/[...path]/route.ts) repeats the full-corpus load to construct its asset allowlist. A21KB puzzle image consequently takes roughly1.9s in dev too. Preserve this allowlist boundary when optimizing; never serve arbitrary content paths directly.

### Timings

Node24.19.0 / pnpm11.23.0, local Chromium1440×900, same source and already-validated production build. Three sequential HTTP samples per route; medians below include the complete response, not just the first byte. These are local machine measurements, not hosted/CDN or mobile-network guarantees.

| Route                                | Current development | Local production |
| ------------------------------------ | ------------------: | ---------------: |
| `/about`                             |                21ms |              3ms |
| `/contents`                          |                17ms |              4ms |
| `/changelog`                         |                22ms |              4ms |
| `/blog`                              |             1,787ms |              3ms |
| `/leetcode`                          |             1,815ms |              4ms |
| `/blog/group-theory`                 |             1,907ms |              4ms |
| `/blog/sightseeing-the-sea-of-cpp-1` |             1,772ms |              5ms |
| `/leetcode/2025-11-01`               |             1,889ms |              3ms |
| Referenced puzzle image              |             1,856ms |              3ms |

Browser click-to-visible-main plus two animation frames:80–97ms for the three ordinary reading pages versus1.82–2.33s for writing navigation in the current preview. Local production navigation was39–71ms for the same sequence; production requests returned `x-nextjs-cache: HIT` and ordinary Link prefetching was observed. The installed Link guide explicitly limits automatic prefetching to production. This site already prerenders the archive; do not misdiagnose the production pages as uncached per-request Markdown rendering.

Standalone loader decomposition, with imports/highlighter warmed:

- Full `loadPosts`:1.23–1.28s per call; first call1.75s. Builds2.46MB of rendered HTML even for an index or a single detail lookup.
- Equivalent source reads/frontmatter parsing for226 files, without rendering:18–20ms. This is a diagnostic microbenchmark, not a replacement loader with all path/asset guarantees implemented.
- Rendering all already-read bodies:1.16–1.19s. A CPU sample shows substantial WebAssembly/Oniguruma syntax-tokenization and Markdown/AST traversal work.
- Reading/parsing/rendering only the requested post: Group Theory16–17ms, C++36–38ms, latest daily entry3ms. These isolate avoidable work; they are not promised end-to-end optimization results.

### Separate preview transport problem

The existing port3000 preview also emitted repeated HMR WebSocket handshake failures (`ERR_INVALID_HTTP_RESPONSE` on `/_next/webpack-hmr`). Its client waves did not mount, and clicks requested whole documents instead of RSC navigation payloads. This is an additional observed preview problem, not normal production behavior. Its external process/transport configuration was not changed or conclusively diagnosed.

A clean, owned dev server using a disposable copy of the same app/content on3197 had no browser/HMR errors, mounted the wave clients and used a real RSC fetch for About→Blog. It **still** took roughly2s to navigate to Blog. Its warm HTTP requests reproduced the writing slowdown. Therefore, broken preview hydration does not account for the render-all bottleneck, and fixing only the preview connection will not remove it.

There is no `loading.tsx` or route-level loading fallback on these paths, so this server work also appears as an unresponsive link. A loading indication would improve feedback, not eliminate the unnecessary work.

## Recommended next implementation

1. Separate metadata/source discovery from Markdown rendering. Indexes, static params, feeds and sitemap should not highlight articles.
2. Resolve a detail post by its validated collection/slug and render only that post. Keep complete corpus validation in `content:check`/build and preserve missing/draft404 behavior.
3. If still needed, cache rendered output by source identity/content fingerprint, with correct edit/delete/image invalidation. Do not apply a blanket permanent cache that breaks fresh draft previews or asset inclusion.
4. Derive/reuse the referenced-image allowlist without rendering the entire archive for each image request. Retain traversal/symlink/type/draft safeguards.
5. Independently inspect or owner-restart the existing preview server/transport. Add loading feedback only after addressing the expensive work; no animation/dependency redesign is needed.

Use before/after warm dev HTTP and hydrated RSC navigation measurements, a count-based regression proving one detail request does not render unrelated articles, and existing draft/edit/publish/unpublish/asset tests. Then run repository and browser validation. [DEBT-008](../../debt.md) tracks this unimplemented optimization.

## Evidence and handoff

- Executed ignored profiling scripts: `.task-workflow/writing-performance/profile-navigation.mjs`, `profile-loader.mjs` and `profile-isolated-dev.mjs`. JSON results, request timings, Next application-vs-framework timing logs and a CPU profile are in the same ignored directory. Timings above preserve the durable conclusions without depending on those local artifacts.
- Production benchmark used an owned3100 server against the existing build. The clean dev comparison copied only required public source/content/configuration, shared installed dependencies read-only, and used separate output on3197. Both owned servers/browser contexts closed and the exact scratch copy was removed. The user's3000 server was not stopped.
- Before documentation edits, hashes of every tracked/nonignored file matched investigation startup. Only this report, its index, the debt entry and a linked correction to the archive plan are investigation changes. No app/content/style/config/test implementation changed.
- Verification for this docs-only investigation: direct HTTP/browser/source/CPU profiling above; `pnpm docs:check`, touched-file formatting and `pnpm validate` run before handoff. Full public and isolated-authoring suites are not rerun because application source did not change; prior migration results remain historical, not newly claimed runs. Physical device, hosted site and independent review were not performed.
- Next at investigation close: implement the metadata/detail split and verify measurable gains. Investigation is complete; no optimization was implemented by this investigation.

## Subsequent implementation

Eric subsequently requested the fix. The [writing-performance implementation](../active/2026-09-14-writing-performance.md) records the metadata/detail/asset split, measured before/after gains and fresh regression/browser evidence. This investigation remains historical evidence, not the implementation or an independent review.
