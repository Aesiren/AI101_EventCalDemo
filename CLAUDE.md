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
  app.vue        MUST render <NuxtPage /> — the Nuxt starter template ships <NuxtWelcome />
                 instead, which silently makes every pages/ route unreachable. Caught once
                 already (Milestone 2); don't let it regress.
  pages/
    index.vue         not logged in -> /login; logged in -> a dashboard of every navigable
                       section, role-filtered (US-3.4, Milestone 5). Nuxt's file-based routing
                       makes this the page that loads at `/`, so it can never be the event list.
    login.vue         US-1.13 — dropdown-only login (no free-text name entry)
    events/
      index.vue        minimal list — name + vote count only (US-1.2, revised, Milestone 5)
      [id].vue         full fields + submitter + vote/volunteer controls (US-1.14, US-2.1-2.3)
    submit.vue        US-1.3–US-1.9 (Milestone 3+)
    leader.vue        US-1.11, US-1.12 (Milestone 2, in progress)
  components/    EventCard, EventForm, AiAssistPanel, BaseSupportToggle, ResourcesCommittedToggle, VoteControls
  composables/   useAuth (login, listAccounts), useEvents (refresh, createEvent, fetchEvent)
  middleware/    requireLeader.ts — but referenced in definePageMeta as 'require-leader'
                 (kebab-case). Nuxt derives the middleware name from the filename and
                 normalizes camelCase to kebab-case; the camelCase string typechecks as an error
                 (TS2820) but wouldn't fail at runtime in a component-only test, since middleware
                 doesn't execute during an isolated mountSuspended mount. Caught by
                 `npx nuxi typecheck`, not by the test suite — another reason to always run both.
  utils/         resolveHomeRedirect — pure logic for the index.vue gate
server/
  api/           thin route handlers only — no business logic here
  utils/
    store.ts       in-memory data store (implemented)
    guidelines.ts   AI content-guideline evaluation (not yet implemented — Milestone 3)
    agent.ts        Anthropic SDK wrapper (not yet implemented — Milestone 3)
shared/
  types.ts             Event, Account, Interest, GuidelineResult — the one place these shapes are defined
  eventValidation.ts   presence validation, used by both the server route and EventForm.vue
tests/unit/      mirrors server/, shared/, and app/ (components/composables/middleware/pages/utils)
```

Routing decision logic (`resolveHomeRedirect`, `resolveLeaderRedirect`) is always a pure
`(Account | null) -> string | null` function, tested directly — separate from the thin
`navigateTo`-calling wrapper, which isn't unit-tested. See `docs/07-milestones.md` Milestone 2
for why.

## Critical architectural rule

**Everything AI-related and every guideline string lives under `server/` — never imported by
anything in `app/`.** This is what makes the prompt-injection resistance requirement (US-1.10)
real rather than aspirational: the client never has access to the guideline text or the Anthropic
SDK client. Don't break this boundary for convenience.

## Test strategy

- Vitest (`npx vitest run`, or no args for watch mode). Nuxt test environment configured in
  `vitest.config.ts` via `@nuxt/test-utils`.
- Component tests use `mountSuspended` from `@nuxt/test-utils/runtime`, which needs
  `@vue/test-utils` (installed as a dev dependency — it's an optional peer of `@nuxt/test-utils`,
  not pulled in automatically).
- Composables that call `$fetch` take an **injectable dependency** with a real default, rather
  than relying on Nuxt's auto-import mocking — `vi.stubGlobal('$fetch', ...)` does not reliably
  intercept it (see github.com/nuxt/test-utils/issues/291). Pattern: `login(name, fetcher =
  $fetch)`, tests pass a mock fetcher directly. Follow this pattern for new composables.
- `navigateTo` is different — it mocks cleanly via `mockNuxtImport('navigateTo', () =>
  navigateToMock)` from `@nuxt/test-utils/runtime` (wrap the mock fn in `vi.hoisted()` — the
  factory is hoisted above regular top-level `const`s, same as `vi.mock`). Always mock it in
  component tests rather than letting it run for real — see the Status section below for why.
- Tests are written before implementation (TDD), following **Red → Green → Refactor**:
  1. **Red** — write a test for the behavior first and confirm it fails (the code it needs doesn't exist yet).
  2. **Green** — write the minimum implementation needed to make that test pass.
  3. **Refactor** — clean up the implementation (and/or the test) if needed, then re-run the test to confirm it still passes.
  See `docs/06-scaffolding-plan.md`'s Test Strategy section and `docs/04-test-scenario-inventory.md`
  for the full enumerated scenario list. Test descriptions reference `TC-*` IDs from that doc where
  practical.
- The Anthropic SDK client is mocked in all automated tests — no real API calls in the suite.
- `store.ts`'s clock is injectable (`createStore({ now: () => someDate })`) — never read the
  system clock directly inside store logic; this keeps ordering-dependent tests deterministic.
- Each `createStore()` call returns a fully isolated instance — no shared global state between
  tests unless explicitly intended.

## Commands

- `npm run dev` — start the dev server
- `npm test` — run the full test suite once
- `npx vitest` — watch mode

## Status / known gaps

- Milestones 1–4 complete — **Phase 1 and Phase 2 both done.** A new **Milestone 5 — UI
  Consistency & Navigation** was inserted ahead of the original Phase 3 work (now Milestone 6) —
  see `docs/07-milestones.md` for the current step list. Styling library: **Nuxt UI** (v4+, on
  Tailwind CSS 4) — not yet installed as of this writing.
- **US-1.2 was revised** (see `docs/02-user-stories.md`): the event list shows only name + vote
  count now, not all six fields — that moved to the event's own page (US-1.14, already built).
  `app/pages/events/index.vue` itself hasn't been updated to match yet — that's Milestone 5 step 3.
- Vote/interest data (`voteCount`, `myInterest`) is deliberately kept off the `Event` type itself
  — it's viewer-specific and derived, not intrinsic. Fetched separately via
  `GET /api/events/:id/interest` (`useEvents().fetchInterest()`), consumed by `VoteControls.vue`
  and `VoteCount.vue`, each fetching their own on `onMounted` rather than blocking the hosting
  page's initial render.
- `typescript` + `vue-tsc` are installed and `npx nuxi typecheck` passes clean (see the `^6` pin
  note above for why the version matters).
- **Fixed: always mock `navigateTo` in tests, never let it run for real.** A real `navigateTo()`
  call under `mountSuspended` (previously left unmocked in `login.vue`, `index.vue`, and
  `default.vue`'s tests) could leave an in-flight navigation Promise that settles after its own
  test tears down, occasionally surfacing as an "Unhandled Rejection: ReferenceError: history is
  not defined" from inside `vue-router`, attributed to whichever unrelated test happened to be
  running when it landed. Confirmed non-deterministic (roughly 1-in-3 full-suite runs) before the
  fix, and 8-for-8 clean after. Fix: `mockNuxtImport('navigateTo', () => navigateToMock)` from
  `@nuxt/test-utils/runtime` — this works cleanly for `navigateTo`, unlike the equivalent approach
  for `$fetch` (different auto-import, no equivalent known bug). Requires `vi.hoisted()` for the
  mock function itself, since `mockNuxtImport`'s factory is hoisted above regular top-level
  `const`s, same as `vi.mock`. This is now the standing pattern — new tests that exercise a
  `navigateTo` call should mock it this way rather than letting it run for real.
- Login only persists in client-side reactive state for the current page session (no
  session-restore endpoint) — a hard refresh or a fresh server-rendered request (e.g. `curl`)
  always looks logged-out, even with a valid login cookie present. Deliberate scope decision,
  not a bug; the cookie is real and used server-side for API authorization.
