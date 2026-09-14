---
owner: Eric Zheng
status: current
last_verified: 2026-09-11
---

# Domain-first operating model

Adapted from [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/). Prefer the smallest representation that preserves an evidenced domain fact; types are not a complexity target.

## Working rules

- Parse weak input at its actual boundary: native URLs, bounded JSON, configuration and authored frontmatter. Return the learned structure, not a boolean followed by the original string/object.
- Internal functions accept the representation they require. Do not turn each function call into another input boundary or retain both raw and parsed mutable state.
- Use existing Zod schemas as canonical owners where appropriate. Infer types from them; constrain construction when structural object literals could bypass refinements. Freeze parsed values when later mutation could erase the proof.
- Keep serialization at the edge. A domain value is not an authorization capability: retain resource ownership, byte-before-decode limits, filesystem checks and actual external-state checks.
- Test malformed/valid boundary input and meaningful downstream behavior. Remove repeat parsing, impossible branches and fabrication seams only when the representation actually makes them unnecessary. Do not replace external-state checks with types.
- Assert on evaluated exports, returned objects and observable effects, not on source text. Regexes over `.ts`/`.mjs`/CI/config files, dependency version strings and lockfile contents transcribe structure, churn during behavior-preserving refactors and prove nothing about behavior; a config module's contract is its evaluated export. Policy that only text can express (for example, no hosted secrets in CI) stays a narrow, named boundary assertion.
