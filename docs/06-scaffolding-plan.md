# Scaffolding Plan — Event Calendar Demo

Status: final planning doc, derived from [05-spec.md](./05-spec.md). No implementation code — folder structure, contracts, and build order only. This is the plan TDD implementation will follow.

## Stack (locked in)

Nuxt 4 (currently 4.5.x — Nuxt 3 reached end-of-life July 31, 2026, so a new project starts on 4) + TypeScript + Vitest + Anthropic TypeScript SDK (server-side only) + in-memory store. Rationale is recorded in this conversation; not repeated here.

Nuxt 4 changed the default project layout: `pages/`, `components/`, `composables/`, and `middleware/` now live under a top-level `app/` directory (code that runs in the browser), while `server/` and `shared/` stay at root (server code and code shared between both). The tree below uses that Nuxt 4 default — not the old Nuxt 3 flat layout.

## Folder structure

```
/
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── CLAUDE.md                    (written once implementation starts — see below)
├── docs/                        (this planning chain, 00–06)
├── shared/
│   └── types.ts                 (Event, Account, Interest, GuidelineResult — the one place these shapes are defined; both client and server import from here)
├── app/
│   ├── app.vue
│   ├── pages/
│   │   ├── index.vue                 home/redirect gate — not logged in -> /login, else -> /events (no content of its own)
│   │   ├── login.vue                 US-1.13 — mock login
│   │   ├── events/
│   │   │   ├── index.vue              US-1.1, US-1.2 — event list (the actual "home" of the app)
│   │   │   └── [id].vue               individual event detail page
│   │   ├── submit.vue                US-1.3–US-1.9 — manual + AI-assisted submission
│   │   ├── leader.vue                US-1.11, US-1.12 (+ US-2.4, US-2.5 in Phase 2)
│   │   ├── calendar.vue              US-3.1 (Phase 3)
│   │   ├── votes.vue                 US-3.2 (Phase 3)
│   │   └── needs-voting.vue          US-3.3 (Phase 3)
│   ├── components/
│   │   ├── EventCard.vue             renders one event's fields (US-1.2)
│   │   ├── EventForm.vue             manual entry fields + validation (US-1.3, US-1.4)
│   │   ├── AiAssistPanel.vue         conversational fill/correct/reject UI (US-1.5–US-1.9)
│   │   ├── BaseSupportToggle.vue     Leader-only control (US-1.12)
│   │   ├── ResourcesCommittedToggle.vue  Leader-only control (US-2.6)
│   │   └── VoteControls.vue          vote/volunteer buttons (Phase 2)
│   ├── composables/
│   │   ├── useAuth.ts                current account/session state (US-1.13), plus listAccounts() for the login dropdown
│   │   └── useEvents.ts              fetch + mutate events against the API, plus fetchEvent() for the detail page
│   ├── middleware/
│   │   └── requireLeader.ts          route/action guard for Leader-only pages (US-1.12)
│   └── utils/
│       └── resolveHomeRedirect.ts    pure logic for the home-page gate (not logged in -> /login, else -> /events)
├── server/
│   ├── api/
│   │   ├── auth/login.post.ts            FR-6
│   │   ├── auth/accounts.get.ts          seeded account list, for the login dropdown
│   │   ├── events/index.get.ts           FR-1
│   │   ├── events/index.post.ts          FR-2 (manual create, validated)
│   │   ├── events/[id].get.ts            single event fetch, for the detail page
│   │   ├── events/[id]/support.patch.ts  FR-5 (Leader-only)
│   │   ├── events/[id]/vote.post.ts      FR-7 (Phase 2)
│   │   ├── events/[id]/volunteer.post.ts FR-8 (Phase 2)
│   │   ├── events/[id]/resources.patch.ts FR-9, Leader-only (Phase 2)
│   │   └── agent/assist.post.ts          FR-3, FR-4
│   └── utils/
│       ├── store.ts               the in-memory data store — single source of truth
│       ├── guidelines.ts          guideline policy + evaluation logic (pure, no SDK calls)
│       └── agent.ts               Anthropic SDK wrapper + prompt construction
└── tests/
    └── unit/                      mirrors server/ and app/components/ — see Test Strategy below
```

Everything AI-related and every guideline string lives under `server/` — never imported by anything in `app/pages/`, `app/components/`, or `app/composables/`. That boundary is what makes the prompt-injection posture (FR-4) real rather than aspirational.

## Interface contracts

Plain-English signatures for the boundaries between modules — the targets TDD will write tests against first. No implementations yet.

**`server/utils/store.ts`**
- `listEvents(): Event[]`
- `getEvent(eventId): Event | undefined` — single event lookup, for the detail page.
- `createEvent(input: NewEventInput): Event` — sets `baseSupport: false`, `createdAt: now` internally; caller can't set either.
- `setBaseSupport(eventId, value: boolean): Event`
- `setResourcesCommitted(eventId, value: boolean): Event` — Leader-only, mirrors `setBaseSupport` (US-2.6)
- `castInterest(accountId, eventId, kind: 'vote' | 'volunteer'): Event` — enforces one record per (account, event) pair, blocks self-voting, replaces an existing record when kind changes (this is what makes US-2.2/US-2.3 correct by construction rather than by extra checks).
- `listAccounts(): Account[]` — pre-seeded, read-only.

**`server/utils/guidelines.ts`**
- `evaluate(draft: Partial<EventDraft>): GuidelineResult`
- `GuidelineResult` is one of: `{ status: 'clear' }` / `{ status: 'correctable', guideline: string, message: string }` / `{ status: 'rejected', guideline: string, message: string }`
- Pure function, no network calls — this is what makes it cheap to TDD first, before the agent even exists.

**`server/utils/agent.ts`**
- `assist(conversation, userInput): AgentTurnResult`
- `AgentTurnResult`: proposed fields so far, list of still-missing fields (gathered together, not one at a time — per the confirmed US-1.6 behavior), the current `GuidelineResult`, an optional follow-up question, and whether submission is currently allowed.
- Internally calls `guidelines.evaluate()` — the agent never overrides a guideline verdict itself.

**API routes** (`server/api/**`) — thin: parse request, call the corresponding store/guideline/agent function, return its result. No business logic lives in a route handler.

**`app/composables/useEvents.ts`** — wraps the `/api/events*` routes for pages/components; nothing in the UI layer talks to `server/utils/*` directly.

**`app/utils/resolveHomeRedirect.ts`** and **`app/middleware/requireLeader.ts`'s `resolveLeaderRedirect`** — both are pure `(Account | null) -> string | null` decision functions, kept separate from the `navigateTo` call that actually acts on them. This is the standing pattern for anything routing-related: decide first as testable pure logic, act second in a thin wrapper that isn't unit-tested directly.

## Test strategy

- Vitest for everything — unit tests for `server/utils/*` (store, guidelines, agent) and component tests for `app/components/*`.
- Write tests against the interface contracts above before writing their implementations — `guidelines.ts` first, since it's pure logic with no dependencies, then `store.ts`, then `agent.ts` (which depends on both).
- The Anthropic SDK client is mocked in all automated tests — no real API calls in the test suite. Real calls happen during manual/interactive development only.
- `createdAt`/`now` is injectable (not read from the system clock directly inside `store.ts`), so ordering tests (TC-3.2-02, TC-3.3-01) are deterministic.
- Every scenario in [04-test-scenario-inventory.md](./04-test-scenario-inventory.md) should map to exactly one test; TC IDs make good test-description prefixes for traceability.
- **Install `@nuxt/test-utils@^4`, `vitest@^4`, and `happy-dom@^20.0.11` together, explicitly, at Milestone 1** — don't let a package manager resolve these independently. `@nuxt/test-utils` v4 is built specifically around Vitest v4 as its peer dependency, and older `happy-dom` versions have a known incompatibility with `@nuxt/test-utils` under Vitest 4. Pinning all three up front avoids a silent mismatched install.

## Build order

Sequenced so each milestone is a working, demoable state — not just "Phase 1/2/3" repeated, but the dependency order within Phase 1 itself.

1. **Skeleton** — Nuxt + TS + Vitest init, `shared/types.ts` drafted, `server/utils/store.ts` with seeded mock accounts. No UI. Explicitly install `@nuxt/test-utils@^4`, `vitest@^4`, and `happy-dom@^20.0.11` together as part of this step (see Test Strategy). Done when store unit tests pass.
2. **Core CRUD, no AI** — event list page, manual submission form + validation, mock login, Leader view + Base support toggle. (US-1.1–1.4, 1.11–1.13). Done when this is a fully working app minus the AI assist button.
3. **AI layer** — `guidelines.ts` (TDD'd standalone first), then `agent.ts`, then `agent/assist.post.ts`, then `AiAssistPanel.vue`. Prompt-injection scenarios (US-1.10) tested last, against the finished agent. **This milestone is Phase 1 demo-complete.**
4. **Phase 2** — `castInterest` in the store, vote/volunteer API routes and UI, vote totals and Resources Committed flag on the Leader view.
5. **Phase 3** — calendar, chart, and needs-voting views. Purely additive reads over existing data; no new server contracts expected beyond what Phase 1/2 already established.

## CLAUDE.md

Not written yet — it gets created at the **end** of Milestone 1, once the skeleton (folder structure, store, types) actually exists to describe, and should record: this folder structure, the "AI/guidelines never leave `server/`" boundary, the test strategy above, and a pointer back to [05-spec.md](./05-spec.md) as the source of truth for behavior. Keeping it thin and pointing at the docs chain avoids duplicating content that would drift out of sync.

## Traceability chain

[00-idea-capture](./00-idea-capture.md) → [01-problem-framing](./01-problem-framing.md) → [02-user-stories](./02-user-stories.md) → [03-acceptance-criteria](./03-acceptance-criteria.md) → [04-test-scenario-inventory](./04-test-scenario-inventory.md) → [05-spec](./05-spec.md) → this doc → [07-milestones](./07-milestones.md). Planning complete — implementation starts at Milestone 1.
