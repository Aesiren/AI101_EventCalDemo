# Event Calendar Demo

An "AI101" teaching demo: an event-submission calendar where an AI agent assists submitters and
enforces content guidelines during authoring, and Base leadership decides which events get
official support. Not for release — no CI/CD. TDD throughout.

**Full requirements live in `docs/`, not here.** Start with [`docs/05-spec.md`](docs/05-spec.md)
(functional/non-functional requirements, data model, AI guideline policy) and
[`docs/07-milestones.md`](docs/07-milestones.md) (build order). The full chain, in order:
`docs/00-idea-capture.md` → `01-problem-framing.md` → `02-user-stories.md` →
`03-acceptance-criteria.md` → `04-test-scenario-inventory.md` → `05-spec.md` →
`06-scaffolding-plan.md` → `07-milestones.md`. This file stays thin on purpose — it points at
those docs rather than duplicating them, so it can't drift out of sync.

## Stack

Nuxt 4 (TypeScript) + Vitest + Anthropic TypeScript SDK (server-only) + in-memory store.

**Node 24 LTS is required** (see `.nvmrc`) — Nuxt 4.5.x's `engines` field does not support the
Node 25.x line; run `nvm use` before working in this repo.

**`typescript` is pinned to `^6`, not `^7`.** TypeScript 7.0 (the new native Go-based compiler,
GA July 2026) isn't yet supported by `vue-tsc` — it needs an in-process TypeScript API that isn't
stable in the native build. That gap is expected to close around TypeScript 7.1 (~October 2026).
Until then, don't let `typescript` float to `^7` here — it breaks `npx nuxi typecheck` with
`ERR_PACKAGE_PATH_NOT_EXPORTED` (package subpath `./lib/tsc` not exported). Safe to revisit once
`vue-tsc` publishes TS 7 support.

## Folder structure

Nuxt 4's default layout: browser-side code lives under `app/`, server-side code stays at root
under `server/`, and code shared between both lives in `shared/`.

```
app/
  pages/         one file per route
  components/    EventCard, EventForm, AiAssistPanel, BaseSupportToggle, ResourcesCommittedToggle, VoteControls
  composables/   useAuth, useEvents
  middleware/    requireLeader
server/
  api/           thin route handlers only — no business logic here
  utils/
    store.ts       in-memory data store (implemented)
    guidelines.ts   AI content-guideline evaluation (not yet implemented — Milestone 3)
    agent.ts        Anthropic SDK wrapper (not yet implemented — Milestone 3)
shared/
  types.ts       Event, Account, Interest, GuidelineResult — the one place these shapes are defined
tests/unit/      mirrors server/ and app/components/
```

## Critical architectural rule

**Everything AI-related and every guideline string lives under `server/` — never imported by
anything in `app/`.** This is what makes the prompt-injection resistance requirement (US-1.10)
real rather than aspirational: the client never has access to the guideline text or the Anthropic
SDK client. Don't break this boundary for convenience.

## Test strategy

- Vitest (`npx vitest run`, or no args for watch mode). Nuxt test environment configured in
  `vitest.config.ts` via `@nuxt/test-utils`.
- Tests are written before implementation (TDD) — see `docs/06-scaffolding-plan.md`'s Test
  Strategy section and `docs/04-test-scenario-inventory.md` for the full enumerated scenario list.
  Test descriptions reference `TC-*` IDs from that doc where practical.
- The Anthropic SDK client is mocked in all automated tests — no real API calls in the suite.
- `store.ts`'s clock is injectable (`createStore({ now: () => someDate })`) — never read the
  system clock directly inside store logic; this keeps ordering-dependent tests deterministic.
- Each `createStore()` call returns a fully isolated instance — no shared global state between
  tests unless explicitly intended.

## Commands

- `npm run dev` — start the dev server
- `npx vitest run` — run the full test suite once
- `npx vitest` — watch mode

## Status / known gaps

- Milestone 1 (skeleton) in progress. `shared/types.ts` and `server/utils/store.ts` exist and are
  fully tested; no UI yet.
- `typescript` + `vue-tsc` are installed and `npx nuxi typecheck` passes clean (see the `^6` pin
  note above for why the version matters).
