---
owner: Eric Zheng
status: current
last_verified: 2026-09-06
---

# Studio auth data foundations

This is the second bounded step-2 slice of [the CMS plan](../plans/active/2026-09-05-dynamic-cms-studio.md), under [accepted ADR-0002](../decisions/0002-dynamic-content-and-hosted-studio.md). It implements **non-runtime data contracts, platform-crypto helpers and migration artifacts**, not a login service. No studio/auth routes, cookies, WebAuthn verifier, environment gate, auth repository or application DB connection exist. Nothing in the public site imports these modules. Approval/design work is already settled and was not repeated.

## Source and evidence

| Path                                                | Responsibility                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `cms/auth/contracts.ts`                             | Strict singleton-owner, credential, session, challenge and RP-binding record schemas                 |
| `cms/auth/tokens.ts`                                | Node crypto random tokens, purpose-separated SHA-256 digests and constant-time digest comparison     |
| `cms/auth/eligibility.ts`                           | Pure, fail-closed checks over fresh server records; no DB reads or writes                            |
| `cms/db/auth-schema.ts`                             | Four Drizzle auth tables, re-exported by `cms/db/schema.ts` for one migration chain                  |
| `cms/db/migrations/0002_studio_auth_foundation.sql` | Generated additive auth DDL and corresponding snapshot                                               |
| `cms/db/migrations/0003_studio_auth_integrity.sql`  | Custom identity, revocation, lifetime and consumption update guards                                  |
| `tests/cms/auth-*.test.mjs`                         | Twenty token/record/eligibility tests; two more auth artifact tests live in `schema.test.mjs`        |
| `tests/helpers/cms-auth-db-checks.mjs`              | Five auth constraint subtests inside the existing isolated suite's rollback-only fixture transaction |

All **80** database-free CMS tests pass (19 content/foundation, 22 auth/schema, seven Docker-safety/lifecycle, 16 shared/local adapter/CI and 16 Neon configuration/factory cases). The generated SQL/snapshots match the definitions; `drizzle-kit check` passes. On 2026-09-06 the provider-transition `pnpm test:cms:docker` run passed **19 integration tests twice** on disposable PostgreSQL 17.11, including all five auth subtests and fixture rollback. The original four migrations required no changes. This proves the covered SQL guards and local transaction-adapter mechanics, not real sign-in, concurrent challenge consumption or endpoint authorization; Neon lifecycle stubs are offline, not hosted SQL/TLS/PgBouncer evidence. The auth fixture helper uses PostgreSQL's clock for DB-generated issuance times, avoiding observed host/VM skew without changing eligibility/schema rules.

The additive auth-record slice changed no dependencies/drivers; the later [transaction foundation](cms-foundations.md#interactive-transaction-adapter-foundation-only) adds lazy local `pg` / Neon verified-TLS SQL adapters and an isolated CI job, still without browser-runner or public-route changes. The installed Next.js 16 authentication guide was reviewed: secure authorization belongs at each data access/mutation, not only a layout/proxy; its educational password/signup examples are not this product's passkey-only scope.

## Record model

All record schemas are strict and reject unknown fields without coercion or stripping. They are server-record projections, **not** client request DTOs. Future adapters must convert DB timestamp values to ISO strings before validation. Auth records are separate from content snapshots and must never enter content export/import; that export boundary is still unimplemented.

| Table                | Stored contract                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `studio_owner`       | A singleton (`id = 1`), stable random 32-byte WebAuthn user handle, positive `auth_version` and creation time. No email/password/signup or multi-user roles.                                                                                            |
| `studio_credentials` | Internal UUID plus globally unique canonical base64url credential ID, encoded COSE public-key bytes, unsigned 32-bit counter, backup eligibility/state, known transports, exact registration origin/RP, creation/revocation times. Never a private key. |
| `studio_sessions`    | Internal UUID, owner/credential references, unique **hashed** bearer, captured owner `auth_version`, exact origin/RP, creation/expiry/revocation. No raw token.                                                                                         |
| `studio_challenges`  | Unique server-generated challenge, owner/auth version, ceremony purpose, **hashed initiating-browser binding**, exact origin/RP, short lifetime/consumption marker, and conditional enrollment-token hash / authorizing-session reference.              |

The singleton has **no seed/default user handle**. Token-authorized bootstrap must create/read one stable owner identity transactionally; absence of credentials is not authorization. Bootstrap and lost-session recovery are explicit token-gated session exceptions, including when old credentials exist. Additional-credential enrollment requires both the set/matching token and a still-valid owner session.

`auth_version` provides global session/challenge invalidation. It is a captured value, deliberately **not** a foreign key to the owner's current version: a foreign key would prevent advancing it while old records exist. Every future authorized read must compare it with the fresh owner row. Individual credential revocation also invalidates its sessions through the eligibility check; a session-row-only check would miss this.

### Bounds and encoding

- Generated opaque values contain 32 random bytes, serialized as canonical unpadded base64url (43 characters). Schemas reject padding, non-zero unused bits, whitespace, missing/oversized values and aliases. This also defines the future `STUDIO_ENROLL_TOKEN` format; no secret is configured or generated for a live service here.
- Digests use SHA-256 over `website-studio:<purpose>\0` followed by the canonical token, with separate `session`, `challenge-binding` and `enrollment` purposes. SQL stores lowercase 64-character hex hashes. Comparison uses Node `timingSafeEqual` on fixed-length digests. This is not a claim that an entire future network endpoint has constant-time behavior.
- Session lifetime has a conservative **maximum of seven days** from creation; challenge lifetime has a **maximum of five minutes**. Both require positive lifetimes, with expiry exclusive. These are storage ceilings, not a shipped cookie/refresh policy; a later service may choose shorter lifetimes. No silent session extension is supported: rotation must mint a new bearer/row and revoke the old one.
- Credential IDs are bounded to 1–1,023 decoded bytes; COSE public-key encodings to 1–4,096 bytes. Encoding/size validation does **not** parse COSE or verify cryptographic validity. The maintained WebAuthn verifier must supply the values. Test keys are explicitly inert encoding fixtures, not valid COSE or real enrolled credentials.
- Transport hints currently match the installed platform `AuthenticatorTransport` type: `ble`, `hybrid`, `internal`, `nfc`, `usb`. Unknown/future hints are rejected rather than stripped; expand them deliberately with verifier/browser support.
- Counters allow 0 through 2³²−1, including zero-counter synced passkeys. Backup eligibility is stable (`singleDevice`/`multiDevice`), and backed-up credentials must be multi-device. Counter/backup interpretation must remain with the maintained verifier; these checks do not detect cloned authenticators by themselves.

## Eligibility checks and their limits

`checkSessionEligibility` requires complete, valid server projections of owner, credential and session plus the raw request bearer and a **server-controlled** expected RP/clock. It checks token digest, owner/credential identity, owner auth version, credential and session revocation, issuance/expiry, and exact origin/RP binding. It returns only a boolean and logs/returns no record or secret.

`checkChallengeEligibility` checks owner/version, ceremony, expiry, unused state, exact origin/RP and the initiating-browser token. For **every** enrollment it additionally checks the current configured token against the supplied token and the hash captured at challenge issuance. Unsetting or replacing the enrollment token therefore invalidates outstanding enrollment challenges; an additional session cannot bypass that requirement. Additional enrollment revalidates the same authorizing session and its credential/bearer. Bootstrap/recovery deliberately do not require a session or infer permission from a zero-credentials count.

These are **advisory preflights**, not a WebAuthn verifier or a challenge-consumption service. The tests deliberately demonstrate that an unchanged, unconsumed snapshot can pass twice. Never use this boolean to mint a session or authorize a write on its own.

Required step-3 integration remains:

1. Enforce server deployment policy on every operation, before auth work: configured production origin/RP and explicitly configured loopback `localhost` development/test with isolated Postgres only. Preview/other deployments return 404. Never derive allowed mode, expected origin/RP or time from client claims, Host/forwarded headers or the WebAuthn response. The RP schema is only structural: even a preview HTTPS origin can be structurally valid. No environment is enabled by these helpers.
2. Issue options/challenges on the server. Bind them to a short-lived HttpOnly initiating-browser cookie; persist only its hash. Require the enrollment token at issuance as well as completion. Do not trust a client-supplied expected challenge or owner user handle.
3. At completion, recheck eligibility under the actual transaction/conditional update, claim the bound attempt exactly once with checked row count and current DB expiry, and verify with a maintained WebAuthn verifier using the **stored** challenge/origin/RP and required user verification. Validate the assertion's owner/user-handle binding. Failed verification must not mint a session or rearm a consumed challenge. Test the chosen consume/verify/commit failure path and lost responses explicitly.
4. Serialize credential-counter updates with successful authentication, persist only verified credentials, and issue/rotate/revoke sessions transactionally. Recheck owner epoch and authorizing-session revocation at commit so another tab's recovery/revocation cannot be bypassed by a stale preflight. Never cache authoring/session state in shared public caches.
5. Wire HttpOnly/SameSite/Secure/expiry/path cookie policy, CSRF/origin protection, rate limits and safe errors/DTOs in the real server boundary. Keep `server-only` enforcement there and use the installed asynchronous Next APIs. No routes or cookies were added in this slice.

## SQL artifact guarantees versus runtime proof

The new custom migration is additive; the first content SQL and snapshots were left unchanged. It defines:

- immutable owner identity/user handle, with auth-version changes advancing exactly once;
- immutable credential identity/public key/RP/device eligibility, nondecreasing counters and irreversible revocation;
- immutable session identity/hash/scope/expiry, permitting only irreversible revocation;
- immutable challenge purpose/value/bindings/expiry, permitting one transition from unused to consumed and no reset/rebinding.

The schema has FK, uniqueness, hash/encoding, lifetime and ceremony-binding checks. SQL encoding/RP checks are coarser than full zod validation; full record validation remains mandatory. Guard artifacts do not authorize enrollment, verify signatures, bind a request to the right environment, or establish actual concurrent transaction behavior. Privileged DDL/truncate can bypass row guards; least-privilege runtime roles and negative operation tests remain required.

Challenge/session cleanup may delete records after their retention/expiry policy is defined; a missing record must always deny access. Delete referencing challenges before session cleanup. No cascading deletes or cleanup worker are added. Backup/restore must treat auth-bearing databases as secret and invalidate/reconcile sessions, pending challenges and revoked credentials before reopening the studio. Recovery targets, retention, procedures and an isolated restore drill remain owner/platform release work, not evidence supplied here.

## Next prerequisite

The local SQL prerequisite passed on 2026-09-06. Repeat with the opt-in `pnpm test:cms:docker`, or privately supply a confirmed isolated target per [setup](../development.md#isolated-postgresql-prerequisite); never paste credentials into chat. The disposable container/database was removed, so no standing target or test credential is retained. Repository CI Postgres configuration and the thin local/Neon transaction boundary are implemented; only local direct `pg` and offline Neon options/lifecycle were exercised, not hosted CI or Neon. The bounded provider return is complete; next are remaining recovery/seed/localhost prerequisites, not Neon Auth adoption. Existing passkey/auth records and all migration artifacts remain unchanged. Before hosted migrations, the [Neon isolation gate](cms-foundations.md#hosted-isolation-prerequisite-not-configured) requires grants/default-privilege review, distinct least-privilege SQL roles and confirmation that private passkey/session/challenge records have no optional Data API/browser access path. Recovery platform/retention/RPO/RTO still need Eric's choices within $0. No hosted service, production secret or real content was provisioned. Security endpoints, hosted five-second cache proof and database/media recovery release gates remain open.
