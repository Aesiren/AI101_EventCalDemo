# Milestones — Event Calendar Demo

Status: expands the Build Order in [06-scaffolding-plan.md](./06-scaffolding-plan.md) into concrete, ordered action lists. TDD order (tests before implementation) throughout, per that doc's Test Strategy. Story/requirement/test-case IDs are cited so each action traces back to why it exists.

## Milestone 1 — Skeleton

No UI. Done when store unit tests pass, `npm run dev` boots an empty app without errors, and `CLAUDE.md` exists.

1. `npx nuxi init` — scaffold the Nuxt 4 project, TypeScript template.
2. Install and pin test tooling explicitly, together, in one install: `@nuxt/test-utils@^4`, `vitest@^4`, `happy-dom@^20.0.11`.
3. Install `@anthropic-ai/sdk` — not used until Milestone 3, but installed now so `package.json` reflects the full stack from the start.
4. Configure `vitest.config.ts` for the Nuxt Vitest environment.
5. Write `shared/types.ts` — `Event` (including `dateTime`, `baseSupport`, `resourcesCommitted`, `submittedBy`, `createdAt`), `Account` (id, name, role), `Interest` (accountId, eventId, kind), `GuidelineResult`.
6. Write `server/utils/store.ts`'s tests first, against the interface contract fixed in the scaffolding plan:
   - `listEvents()` / `listAccounts()` return seeded data.
   - `createEvent()` defaults `baseSupport: false`, stamps `createdAt` from an injectable clock (not `Date.now()` directly).
   - `setBaseSupport()` flips the flag.
   - `setResourcesCommitted()` flips the flag, mirroring `setBaseSupport()` (US-2.6) — TDD'd now for the same reason as `castInterest()` below, since its contract was already fixed once the Resources Committed decision cascaded through doc 06.
   - `castInterest()` — one record per (account, event) pair, self-voting blocked, switching `kind` replaces rather than duplicates. *(These are Phase 2 rules, TDD'd now since the contract is already fixed — Milestone 4 becomes wiring, not new logic.)*
7. Implement `store.ts` against those failing tests until green.
8. Seed mock accounts — a small fixed list of User/Leader accounts for the mock-login flow (US-1.13).
9. Write `CLAUDE.md` — now that the skeleton exists to describe: this folder structure, the "AI/guidelines never leave `server/`" boundary, the test strategy (Vitest, mocked SDK, injectable clock), and a pointer to [05-spec.md](./05-spec.md) as the source of truth.

## Milestone 2 — Core CRUD, no AI

Covers US-1.1–1.4, 1.11–1.13 (FR-1, FR-2, FR-5, FR-6). Done when manual submission, login, and the Leader's Base-support toggle work end-to-end, with the AI-assist entry point hidden or disabled.

**Routing note (retrofitted after steps 1–11 were already built the old way):** `app/pages/index.vue` is the site's home page in Nuxt's file-based routing — it's what loads at `/`, before anything else. It can't be the event list; it has to be a redirect gate (not logged in → `/login`, logged in → `/events`), or the event list would be the only page anyone could ever reach. The event list itself lives at `app/pages/events/index.vue`, with `app/pages/events/[id].vue` as an individual event's page. The list below reflects this corrected structure — not the order these were actually first built in.

1. Extend `shared/types.ts` as needed (e.g. `NewEventInput`, login request/response shapes).
2. `server/api/auth/login.post.ts` — test then implement mock login (US-1.13).
3. `server/api/auth/accounts.get.ts` — lists seeded accounts (id/name/role, nothing sensitive); thin, no dedicated test. Backs the login page's dropdown (see step 14) — closes the account-listing gap flagged at step 1.
4. `app/composables/useAuth.ts` — current account/session state, plus `login()` and `listAccounts()`; test then implement. `login`/`listAccounts` take an injectable `fetcher` (default `$fetch`) rather than relying on Nuxt's `$fetch` auto-import being mockable (see `CLAUDE.md`).
5. `app/middleware/requireLeader.ts` — Leader-only route/action guard; test then implement. Decision logic (`resolveLeaderRedirect`) is a pure function, tested separately from the `navigateTo` call that acts on it.
6. `server/api/events/index.get.ts` (FR-1) — list events; test then implement.
7. `server/api/events/index.post.ts` (FR-2) — manual create with presence validation on all fields including `dateTime`; write validation tests first (TC-1.4-01–06), then implement. Validation logic lives in `shared/eventValidation.ts` (not `server/utils/`), since `EventForm.vue` needs the identical rule for client-side feedback.
8. `server/api/events/[id].get.ts` — single event fetch, backed by a new `store.getEvent(id)`; needed for the detail page (step 13).
9. `app/composables/useEvents.ts` — wraps the events API for the UI layer (`refresh`, `createEvent`, `fetchEvent`); test then implement, same injectable-fetcher pattern as `useAuth`.
10. `app/components/EventCard.vue` — renders all six fields, true/false Base-support states visibly distinct (US-1.2 / TC-1.2-01–03); component test then implement.
11. `app/components/EventForm.vue` — manual entry + blocking validation UI (US-1.3, US-1.4); component test then implement.
12. `app/pages/events/index.vue` — the event list itself, including empty state (TC-1.1-02); wire `EventCard` + `useEvents`, each card linked to its detail page.
13. `app/pages/events/[id].vue` — individual event detail page; fetches by route id, shows a not-found state if the id doesn't match anything.
14. `app/pages/login.vue` — login UI. Dropdown-only, populated from `useAuth().listAccounts()` — no free-text name entry, so a name can't be mistyped.
15. `app/utils/resolveHomeRedirect.ts` + `app/pages/index.vue` — the home/redirect gate described above. `resolveHomeRedirect` is a pure function (same pattern as `resolveLeaderRedirect`), tested separately from the page's `navigateTo` call.
16. `app/pages/submit.vue` — hosts `EventForm` (manual path only for now).
17. `server/api/events/[id]/support.patch.ts` (FR-5) — Leader-only toggle; test then implement, including the permission check (TC-1.12-03).
18. `app/components/BaseSupportToggle.vue` — Leader-only control, not rendered/available for User-role accounts; component test then implement.
19. `app/pages/leader.vue` — Leader view: full event list + toggle (US-1.11, US-1.12).

## Milestone 3 — AI layer

Covers US-1.5–1.10 (FR-3, FR-4). **This milestone is Phase 1 demo-complete.**

1. `server/utils/guidelines.ts` tests first — the full guideline table from [05-spec.md](./05-spec.md): correctable cases (TC-1.7-01–04), valid exceptions that must **not** be flagged (TC-1.7-06, TC-1.7-07), and the two irreparable-on-any-presence rules (TC-1.9-01, TC-1.9-02). Implement `evaluate()` against those tests, pure logic, no SDK calls.
2. `server/utils/agent.ts` tests first, with the Anthropic SDK client mocked — field-fill from free text (TC-1.5-01–03), gathering all missing fields into one follow-up (TC-1.6-01–03), the correction round-trip (TC-1.7-05), allowing submit once clear (TC-1.8-01/02), outright rejection with a named, non-correctable reason (TC-1.9-03), and prompt-injection resistance including not disclosing its own instructions (TC-1.10-01–04). Implement `agent.ts`, calling `guidelines.evaluate()` internally — the agent never overrides a guideline verdict itself.
3. `server/api/agent/assist.post.ts` — thin route wrapping `agent.assist()`; test then implement.
4. `app/components/AiAssistPanel.vue` — free-text entry, follow-up prompts, proposed-fields preview, correction messaging, submit/reject actions; component test for state transitions then implement.
5. Wire `AiAssistPanel` into `app/pages/submit.vue` alongside the manual `EventForm` (e.g. as a second tab/mode).
6. Manually verify one real end-to-end call against the live Anthropic API (outside the automated suite, per the Test Strategy's "real calls are dev-only" rule) to sanity-check the actual prompt/guideline behavior against a real model response.

## Milestone 4 — Phase 2 (Democracy)

Covers US-2.1–2.5 (FR-7, FR-8, FR-9). Mostly wiring, since `castInterest`'s rules were already TDD'd into the store at Milestone 1.

1. `server/api/events/[id]/vote.post.ts` (FR-7) — test (TC-2.1-01, self-vote blocked TC-2.1-02, duplicate-vote no-op TC-2.2-01) then implement, calling `store.castInterest(kind: 'vote')`.
2. `server/api/events/[id]/volunteer.post.ts` (FR-8) — test (mutual exclusivity, TC-2.3-01–03) then implement, calling `store.castInterest(kind: 'volunteer')`.
3. `app/components/VoteControls.vue` — vote/volunteer buttons, "already voted" state (TC-2.2-02), and hides voting controls on the current user's own events (TC-2.1-02 at the UI layer, not just the API); component test then implement.
4. Wire `VoteControls` into `app/pages/events/index.vue`.
5. Display vote totals on `app/pages/leader.vue` (US-2.4 / TC-2.4-01).
6. `server/api/events/[id]/resources.patch.ts` (FR-9) — Leader-only toggle, mirrors `support.patch.ts`; test (TC-2.6-01–03, including the permission check) then implement, calling `store.setResourcesCommitted()`.
7. `app/components/ResourcesCommittedToggle.vue` — Leader-only control, not rendered/available for User-role accounts; component test then implement.
8. Add the toggle to `app/pages/leader.vue` alongside the Base support toggle (US-2.5, US-2.6 / TC-2.5-01/02).

## Milestone 5 — UI Consistency & Navigation — done

Covers US-1.2 (revised), US-3.4, US-3.5 (FR-1, FR-1b, FR-13, FR-14). Inserted ahead of the
original Phase 3 milestone (now Milestone 6) at your request — cross-cutting UI work, not new
product features, so it's scheduled before the calendar/chart/needs-voting build even though its
story IDs live under the Phase 3 "Beautification" theme (see the note in
[02-user-stories.md](./02-user-stories.md)).

**Already done, not part of this milestone's step list:** the "voting buttons and event details
on the detail page" half of the request — `app/pages/events/[id].vue` already hosts `EventCard`
(full fields), the resolved submitter name, and `VoteControls` (US-1.14). That was built in a
prior session as an ad-hoc addition once its need became apparent. What's left is removing that
same content from the *list* page and doing the actual styling work.

1. Install and configure `@nuxt/ui` (v4+) — add the module to `nuxt.config.ts`; it brings its
   Tailwind CSS 4 dependency along.
2. Restyle `app/layouts/default.vue` (the site header/nav) with Nuxt UI components — this
   establishes the shared visual baseline every other page inherits.
3. Simplify `app/pages/events/index.vue` to a minimal list — each item shows only the event's
   name (linked to its detail page) and its `VoteCount` (reused component, already shows a
   read-only total); remove `EventCard`/`VoteControls` from the list entirely. Restyle with Nuxt
   UI list/card components. (US-1.2 revised, TC-1.2-04/05/06 — update
   `tests/unit/app/pages/events/index.test.ts` first, since its assertions currently expect full
   `EventCard` content on the list.)
4. Redesign `app/pages/index.vue` as a Nuxt UI dashboard — a card/tile per navigable section
   (Events, Submit an Event, and Leader Review when the account is a Leader), replacing the
   current plain-text welcome links. (US-3.4, TC-3.4-01/02/03.)
5. Restyle `app/pages/login.vue` and `app/pages/submit.vue` (its tab toggle, `EventForm.vue`,
   `AiAssistPanel.vue`) with Nuxt UI form/tab/button components.
6. Restyle `app/pages/events/[id].vue` (`EventCard.vue`, `VoteControls.vue`) and
   `app/pages/leader.vue` (`BaseSupportToggle.vue`, `ResourcesCommittedToggle.vue`,
   `VoteCount.vue`) with Nuxt UI components.
7. Full verification: the existing test suite must keep passing — restyling shouldn't change the
   `data-action`/`name`/`data-tab` attributes tests already rely on; where markup genuinely
   changes shape, update that test first, same TDD discipline as everywhere else. Follow with a
   live visual pass across every page (US-3.5) — this AC is inherently more qualitative than most
   in this project; see the note under US-3.5 in `03-acceptance-criteria.md`.

**Done.** All 7 steps built (156/156 tests passing, `npx nuxi typecheck` clean, live dev-server
smoke test of `/login`, `/events`, `/submit` confirmed Nuxt UI markup and CSS actually render).
One deliberate deviation from "Nuxt UI components everywhere": the login account picker and
`EventForm`'s event-type field stay **native `<select>`** elements (styled to match via a
`.app-select` utility class) rather than Nuxt UI's `USelect`, which doesn't render a real
`<select>` and isn't reliably drivable by `.setValue()` in tests — see the Status section of
`CLAUDE.md` for the full reasoning. `UHeader`'s mobile hamburger toggle is also disabled
(`:toggle="false"`) since it broke a "no button when logged out" test and this app's nav doesn't
need a mobile drawer.

## Milestone 6 — Phase 3 (Beautification) — done

Covers US-3.1–3.3 (FR-10, FR-11, FR-12). Purely additive reads over existing data — no new server contracts expected.

1. Write a pure, testable date-grouping helper (e.g. `shared/utils/groupEventsByDate.ts`) — test first, then implement.
2. `app/pages/calendar.vue` — month grid, events on their correct day (TC-3.1-01), empty days render without error (TC-3.1-02), month-boundary dates land correctly (TC-3.1-03).
3. Write a pure, testable ranking helper for vote counts, tie-broken by insertion order (TC-3.2-02) — test first, then implement.
4. `app/pages/votes.vue` — chart view using that helper (US-3.2 / TC-3.2-01).
5. Write a pure, testable filter for "events the current user hasn't voted on yet, newest first" — test first, then implement.
6. `app/pages/needs-voting.vue` — using that filter, including the empty state when the user has voted on everything (TC-3.3-02).
7. Wire navigation between all views (`events`, `leader`, `calendar`, `votes`, `needs-voting`) — this includes adding each new page to the Milestone-5 dashboard (`app/pages/index.vue`) and header nav (`app/layouts/default.vue`), not just cross-links between the new pages themselves.
8. New pages should follow the Nuxt UI styling established in Milestone 5 from the start, rather than being restyled after the fact.

**Done.** All 8 steps built (191/191 tests passing, `npx nuxi typecheck` clean, live dev-server
smoke test of `/calendar` and `/votes` confirmed real seeded-data rendering; `/needs-voting`
confirmed redirecting an unauthenticated `curl` request, as expected of its login gate). Notes on
what "no new server contracts" meant in practice, and a few small additions beyond the step list:

- **No new API routes.** `app/composables/useEvents.ts` gained one new method,
  `fetchAllInterests()`, but it's just `Promise.all` over the *existing* per-event
  `GET /api/events/:id/interest` route (one call per event in the current list) — acceptable at
  this demo's data volumes (see docs/05-spec.md's NFR on scale), and it keeps the chart/needs-
  voting pages' vote/interest data one call away without a bulk endpoint.
- **`app/middleware/requireLogin.ts`** (new, not in the original step list) — `needs-voting.vue`
  is meaningless without a "current viewer" to filter against, so it needed its own login gate,
  same pattern as `requireLeader.ts` (`resolveLoginRedirect`, pure and independently tested,
  registered as `'require-login'` kebab-case).
- **`shared/utils/groupEventsByDate.ts`, `rankEventsByVotes.ts`, `filterNeedsVoting.ts`** — all
  three pure helpers take their data as parameters (events, vote-count map, interest map) rather
  than fetching anything themselves, same reasoning as `store.ts`'s injectable clock. Calendar's
  "current month" is likewise read from the system clock in exactly one place
  (`calendar.vue`, not the helper) — tests control it via Vitest's fake timers.
  `filterNeedsVoting` also excludes the viewer's own submitted events and treats volunteering the
  same as voting — see the Confirmed clarifications section in `03-acceptance-criteria.md`.
- **Chart view (`votes.vue`) is hand-rolled bars**, not a charting library — adding one would sit
  outside the "one styling system" boundary from `05-spec.md`'s NFR for a demo that doesn't need
  more than a ranked list with proportional width bars.
- Calendar/Votes are public reads in the header nav (viewable logged out, same as Events); Needs
  Voting only appears once logged in, same as Submit Event.

## Milestone 7 — Cleanup — done

Six small fixes requested after Milestone 6 shipped — not new product features, so most don't get
new story/AC/TC entries (see the Milestone 7 note in [02-user-stories.md](./02-user-stories.md)).
One is a real behavior change against an existing story with full AC/TC coverage: US-3.1 (FR-10)
— see [03-acceptance-criteria.md](./03-acceptance-criteria.md) and
[04-test-scenario-inventory.md](./04-test-scenario-inventory.md).

1. **Highlight color → blue.** Add `app/app.config.ts` with `ui.colors.primary: 'blue'` (Nuxt UI
   defaults to green — see the Styling NFR in `05-spec.md`). One file, no component changes —
   every `UButton`/`UBadge`/focus-ring/active-nav-link that uses the `primary` color token picks
   it up automatically.
2. **Calendar month navigation (US-3.1, TC-3.1-04/05).** `calendar.vue`'s `referenceDate` becomes
   a `ref` instead of a `const`, with previous/next `UButton`s that step it a month at a time; the
   existing `groupEventsByDate(events, referenceDate)` call already reacts to that correctly since
   it's a pure function of its arguments — no change needed to the helper itself. Test first:
   clicking next/previous re-renders the grid for the new month, still correctly bucketing that
   month's events.
3. **Post-submission redirect to the calendar.** `submit.vue`'s `handleSubmitted` calls
   `navigateTo('/calendar')` instead of (not in addition to) setting the inline "Event submitted —
   thank you!" alert — the confirmation now *is* landing on a calendar that shows the just-created
   event, not a message on the page you're leaving. Update `submit.test.ts` to assert
   `navigateTo('/calendar')` was called (mocked, per the standing `navigateTo` pattern in
   `CLAUDE.md`) instead of checking for inline confirmation text.
4. **Top Voted dashboard tile shows the top two (US-3.4, TC-3.4-06/07).** `index.vue`'s Top Voted
   tile previews `rankEventsByVotes(events, voteCounts).slice(0, 2)` instead of its static
   description. `rankEventsByVotes` itself is unchanged — it still ranks every event; only the
   tile-level render is truncated, so the tie-break-by-insertion-order guarantee still applies to
   *which* two end up on top (see Confirmed clarification #5 in `03-acceptance-criteria.md`).
5. **Calendar dashboard tile shows today's events (US-3.4, TC-3.4-04/05).** `index.vue`'s Calendar
   tile previews `filterEventsOnDate(events, new Date())` instead of its static description. Empty
   state ("No events today.") when there are none, same pattern as every other empty-state message
   in the app.
6. **More seed-data variety, no new accounts.** Extend `server/utils/seed.ts`: use all three
   existing seeded accounts (`user-1`, `user-2`, and — not currently used for interests —
   `leader-1`) as voters/volunteers across more events, so vote totals actually differ from each
   other instead of clustering at 0/1. Add 1–2 more events for volume, and seed one event dated on
   the real current date (`new Date()`, not a fixed string) specifically so step 5's Calendar tile
   preview has something to show in a fresh `npm run dev`. Not unit-tested — `seedDemoData()` is
   only ever applied to the singleton `store`, never to `createStore()` test instances (see
   `store.ts`'s own comment on this), so there's nothing here for Vitest to assert against.

**Mid-milestone correction.** Items 4 and 5 were initially built onto the full `/votes` and
`/calendar` pages instead — a `UCard` "today" panel added to `calendar.vue`, and `votes.vue`
sliced to two entries — reading "Top Voted component"/"Calendar component" in the original request
as referring to those pages. You clarified you meant the home dashboard's Calendar and Top Voted
*tiles* (US-3.4) — a live preview on the tile itself, not a change to the destination pages. Both
were reverted (`votes.vue` back to its full ranked list and original "Top Voted Events" title,
`calendar.vue` back to just the navigable grid with no separate panel — its month navigation from
step 2 was correctly scoped from the start and stayed) and rebuilt on `index.vue` instead, each
with its own test-first pass. Steps 4/5 above and the AC/TC entries throughout this doc chain
reflect the corrected, final placement — not the original misplaced one.

**Done.** All 6 items built on their corrected targets (204/204 tests passing, `npx nuxi
typecheck` clean, live dev-server smoke test confirmed the color, `/calendar`'s month navigation
with no stray "today" panel, and `/votes`'s full untruncated list with its original title — the
home-dashboard tiles themselves can't be curl-verified logged-out, per the standing session
limitation, but their own component tests cover the preview/empty-state behavior directly). Two
additions beyond the step list, both small:

- `shared/utils/groupEventsByDate.ts` gained `toDateKey(date)` (local-date-component formatting,
  refactored out of `groupEventsByDate` itself) and `filterEventsOnDate(events, date)` — both
  test-first, both used by `index.vue`'s Calendar-tile preview and reused by `seed.ts` to build the
  today-dated event's `dateTime` without any risk of a UTC/local date-boundary mismatch (see that
  function's own comment). Note this means `calendar.vue` itself no longer imports either — only
  `groupEventsByDate` — since the "today" concern moved to `index.vue`.
- A one-time icon gotcha, not a lasting issue: `calendar.vue`'s first live request logged `[Icon]
  failed to load icon lucide:chevron-left/-right` — a cold-cache warm-up artifact of the Nuxt Icon
  module's local `/api/_nuxt_icon` endpoint, not a broken icon name or a real bug. A second request
  to the same page came back clean with no warnings. Not worth chasing further; noted here in case
  it resurfaces and looks alarming.

## Traceability

Each milestone's action list should be read alongside [04-test-scenario-inventory.md](./04-test-scenario-inventory.md) (the tests being written) and [06-scaffolding-plan.md](./06-scaffolding-plan.md) (the contracts and folder locations). This doc is the "in what order, concretely" layer on top of both.
