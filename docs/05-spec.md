# Spec — Event Calendar Demo

Status: consolidates [00](./00-idea-capture.md)–[04](./04-test-scenario-inventory.md) into one reference. Feeds the Scaffolding plan (Step 7).
This doc doesn't restate every AC/test case — it links to them and states requirements at a higher level, plus the data model and NFRs that don't live anywhere else yet.

## Gap resolved during spec drafting

The original Phase 1 field list had no event date/time, but Phase 2 (US-2.5) needs to check commitments for "specific dates and times" and Phase 3 (US-3.1) needs events to land on calendar days. Per the cross-phase design constraint, adding this after Phase 1 would mean restructuring the core Event entity — so it's been added to Phase 1 now: **Event gets a single required date + time field**, effective immediately. This has been backfilled into [02-user-stories.md](./02-user-stories.md) (US-1.2, US-1.3), [03-acceptance-criteria.md](./03-acceptance-criteria.md), and [04-test-scenario-inventory.md](./04-test-scenario-inventory.md).

## Functional requirements

Requirement statements below are the "what must exist" summary; the *testable* detail lives in [03-acceptance-criteria.md](./03-acceptance-criteria.md) and [04-test-scenario-inventory.md](./04-test-scenario-inventory.md), referenced by story ID.

### Phase 1
- **FR-1** Event list — view all submitted events, each showing only its name (linked) and total vote count. *(US-1.1, US-1.2 — revised, see the note in [02-user-stories.md](./02-user-stories.md))*
- **FR-1b** Event detail page — full fields (location, type, description, date/time, Base support) plus who submitted it, resolved to a display name. *(US-1.14)*
- **FR-2** Manual submission — enter an event by filling in all fields directly, with presence validation. *(US-1.3, US-1.4)*
- **FR-3** AI-assisted submission — free-text input → structured fields, with follow-up questions for anything undeterminable (asked together, not one at a time), guideline checking, a correction path for correctable violations, and outright rejection for irreparable ones. *(US-1.5–US-1.9)*
- **FR-4** Prompt-injection resistance — guideline enforcement holds against adversarial input; the agent doesn't disclose its instructions. *(US-1.10)*
- **FR-5** Leader review — view all events, toggle Base support per event (Leader-only). *(US-1.11, US-1.12)*
- **FR-6** Mock login — pre-seeded accounts tagged User or Leader; app surface matches role. *(US-1.13)*

### Phase 2
- **FR-7** Voting — one vote per user per event; self-voting blocked. *(US-2.1, US-2.2)*
- **FR-8** Volunteering — one recorded interest per user per event (still can't be recorded as both a plain voter and a volunteer at once), but volunteering counts toward the vote total the same as a plain vote — it's a stronger form of support, not an alternative to one. *(US-2.3, revised)*
- **FR-9** Leader decision inputs — vote totals visible per event, and a Resources Committed flag visible and Leader-toggleable per event (mirrors Base support). *(US-2.4, US-2.5, US-2.6)*

### Phase 3
- **FR-10** Calendar view — events shown on their date, for a month the User can navigate to (not just the current one). *(US-3.1, extended Milestone 7)*
- **FR-11** Chart view — events ranked by vote count, ties broken by insertion order. *(US-3.2)*
- **FR-12** Needs-voting view — events the current user hasn't voted on, newest first. *(US-3.3)*
- **FR-13** Home dashboard — every currently-navigable page section shown as a clickable entry, filtered by role (Leader Review only for Leaders); the Calendar and Top Voted entries preview live data (today's events; the top two voted events) rather than a static description. *(US-3.4, extended Milestone 7)*
- **FR-14** Consistent styling — one component library/visual language used across every page. *(US-3.5)*

## AI Agent guideline policy (authoritative)

The agent applies these regardless of how the input is phrased (including injection attempts):

| Guideline | Violation type |
|---|---|
| No alcohol-specific events | Correctable |
| No alcohol at events tailored for under-21 members | **Irreparable** — reject on any presence, incidental or central |
| No promoting a specific company/brand as Base-endorsed | Correctable |
| No gambling, except: raffles with ≥1 free ticket; poker/blackjack with no real money | Correctable |
| No explicit content (excessive sex, violence, gore, language, drug use *as content*) | Correctable |
| No drug use of any kind | **Irreparable** — reject on any presence, incidental or central |

Only the two "irreparable" rows bypass the correction path; every other conflict gets a specific, named correction request before any rejection.

**Response priority (agent.ts), confirmed during manual testing:** rejected > correctable > missing fields > ready to submit. A guideline conflict — whether outright rejection or a correctable one — is always surfaced before asking for any still-missing fields (location, date/time, etc.). The reasoning: a user facing a content problem should see it immediately, rather than being asked to fill in logistics for an idea they might decide not to bother revising at all.

**Bug fix, found via manual testing (see `07-milestones.md`'s Bug Fix section for the full account):** the deterministic check (`guidelines.ts`'s `evaluate()`) scans the current turn's raw user input in addition to the model's re-extracted `name`/`description` fields — not the full conversation history (that would break the "revise → clears the flag" behavior in US-1.7). This closes a real gap where arguing with the agent, in the user's own words, could produce a "clean" turn even though nothing about the event actually changed. The keyword lists themselves were also expanded (missing synonyms like "underage"/"minor"/"champagne") and a word-boundary matching bug fixed (multi-word phrases like "high school" now also catch inflected forms like "high schoolers") — a keyword list is inherently non-exhaustive, so this raises the bar rather than claiming to close the category for good.

## Data model (sketch — entities and relationships, not code)

**Account**
- id, display name, role (`User` or `Leader`). Pre-seeded for mock login; no password/security model.

**Event**
- id, name, location, type (one of the six fixed categories), description
- dateTime: single required date + time value
- baseSupport: boolean, defaults false, settable only by a Leader
- resourcesCommitted: boolean *(Phase 2)*, defaults false, settable only by a Leader (mirrors baseSupport) — meaning unspecified beyond the flag itself
- submittedBy: reference to the submitting Account
- createdAt: timestamp — needed for "newest first" ordering (US-3.3) and insertion-order tie-breaking (US-3.2), not previously called out but implied by both

**Interest** *(Phase 2 — one record per Account/Event pair)*
- accountId, eventId, kind (`vote` or `volunteer`)
- Uniqueness: at most one Interest record per (account, event) pair — this single-record design is what naturally enforces "one vote per user per event" (US-2.2) and keeps a User from being recorded as both a plain voter and a volunteer at once (US-2.3): switching kind replaces the record rather than adding a second one.
- Vote count for an event = count of Interest records for that event where kind = `vote` **or** kind = `volunteer` *(US-2.3, revised — volunteering counts toward the total the same as a plain vote, since it's a stronger form of support, not an alternative to one)*.

## Non-functional requirements

- **Persistence** — in-memory (or a lightweight embedded DB for convenience); nothing needs to survive a restart.
- **Auth** — mock login only, pre-seeded accounts, no real credential security.
- **AI security posture** — guideline enforcement should be reasonably resistant to prompt injection for demonstration purposes ([US-1.10](./03-acceptance-criteria.md)); this is not a claim of production-grade robustness.
- **Performance/scale** — none specified; assume small, single-session demo data volumes.
- **Timezones/recurrence** — explicitly out of scope (see below); a single implicit timezone and non-recurring events are assumed throughout, including the calendar view.
- **Styling** — [Nuxt UI](https://ui.nuxt.com) (v4+, built on Tailwind CSS 4 + Reka UI), chosen for tight Nuxt integration and because its free tier now includes dashboard-layout components (formerly a paid "Pro" feature) that fit US-3.4 directly. No other component library or hand-rolled design system should be introduced alongside it — one system, applied consistently, is the whole point of US-3.5. Primary/highlight color: **blue** (`app/app.config.ts`'s `ui.colors.primary`), changed from Nuxt UI's default green at your request, Milestone 7.

## Definition of Done (per story)

A story is done when: its Acceptance Criteria all pass (verified by its corresponding test scenarios), and it hasn't broken previously-passing scenarios elsewhere in the same phase. No CI/CD gate, no external review gate — solo/demo pace.

## Prioritization

Maps directly to the existing phase structure — no separate MoSCoW pass needed:
- **Must-have (demo complete):** Phase 1 — FR-1 through FR-6.
- **Should-have (if time remains):** Phase 2 — FR-7 through FR-9.
- **Could-have (stretch):** Phase 3 — FR-10 through FR-12.

## Out of scope

Unchanged from [01-problem-framing.md](./01-problem-framing.md#non-goals) — real auth, persistent storage, real payments/real-money gambling, resource management beyond the one boolean flag, multi-base support, CI/CD, native mobile, notifications, recurring events and timezone handling, and production-grade security hardening.

## Traceability chain

[00-idea-capture](./00-idea-capture.md) → [01-problem-framing](./01-problem-framing.md) → [02-user-stories](./02-user-stories.md) → [03-acceptance-criteria](./03-acceptance-criteria.md) → [04-test-scenario-inventory](./04-test-scenario-inventory.md) → this doc → **06-scaffolding-plan (next)**
