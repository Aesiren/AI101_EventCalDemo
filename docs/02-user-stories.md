# User Stories — Event Calendar Demo

Status: derived from [01-problem-framing.md](./01-problem-framing.md). Feeds Acceptance Criteria (Step 4).
IDs are stable references for AC and later test-scenario traceability — don't renumber once AC exists.

## Phase 1 — Basic AI Demonstration

### Viewing events

- **US-1.1** — As a User, I want to view a list of all submitted events, so that I can see what's already been proposed.
- **US-1.2** — *(Revised — see note below)* As a User, I want each event in the list to show just its name and total vote count, so that I can quickly scan what's popular without the list being cluttered by full details.
- **US-1.14** — As a User, I want an event's own page to show all of its details (location, type, description, date/time, Base support) and who submitted it, so that the list can stay minimal while full information is still one click away.

### Manual submission

- **US-1.3** — As a User, I want to manually enter a new event by filling in all fields myself (including its date/time), so that I can submit it without using the AI agent.
- **US-1.4** — As a User, I want to be told which fields are missing or invalid before my manual submission goes through, so that I can fix it without guessing.

### AI-assisted submission

- **US-1.5** — As a User, I want to describe my event idea in my own words and have the AI agent fill in the structured fields, so that I don't have to manually map my idea into the form.
- **US-1.6** — As a User, I want the AI agent to ask me for more information when something is missing or ambiguous, so that I can supply it without restarting the submission.
- **US-1.7** — As a User, I want the AI agent to tell me specifically which guideline my event conflicts with and what to change, so that I have a real chance to correct it before submitting.
- **US-1.8** — As a User, I want the AI agent to let me submit once my event meets all guidelines, so that it moves into the Leader's review queue.
- **US-1.9** — As a User, I want the AI agent to reject an event outright when it irreparably violates a guideline (e.g. drug use), so that I'm not stuck in a correction loop for something that will never be approved.
- **US-1.10** — As a Leader, I want the AI agent's guideline enforcement to hold up even against inputs designed to talk it out of the rules, so that I can trust an AI-cleared event actually meets the guidelines.

### Leader review

- **US-1.11** — As a Leader, I want to view all submitted events, so that I can assess them for Base support.
- **US-1.12** — As a Leader, I want to toggle Base support on or off for a given event, so that I can record leadership's decision.

### Access

- **US-1.13** — As a User or Leader, I want to log in with a demo account tagged to my role, so that the app shows me the view and actions appropriate to that role.

## Phase 2 — Democracy

- **US-2.1** — As a User, I want to vote on another user's submitted event, so that I can signal I'd participate in it.
- **US-2.2** — As a User, I want to be limited to one vote per event, so that vote totals reflect genuine distinct interest rather than repeat voting.
- **US-2.3** — As a User, I want to mark myself as a volunteer to help run an event instead of voting to participate in it, so that my intent (helping vs. attending) is captured accurately.
- **US-2.4** — As a Leader, I want to see the total vote count for each event, so that I can gauge community demand before deciding on Base support.
- **US-2.5** — As a Leader, I want to see whether an event's proposed date/time already has "Resources Committed," so that I can avoid double-booking when deciding on Base support.
- **US-2.6** — As a Leader, I want to toggle the "Resources Committed" flag on or off for an event, so that I can record whether resources are locked in for its date/time (mirrors the Base support toggle, US-1.12).

## Phase 3 — Beautification

- **US-3.1** — As a User, I want a calendar view showing upcoming events for the month, so that I can see what's happening at a glance instead of scanning a flat list.
- **US-3.2** — As a Leader or User, I want a chart view of the top-voted events, so that I can quickly see which ideas have the most community support.
- **US-3.3** — As a User, I want a view listing the newest event ideas that haven't been voted on yet, so that I can find things to vote on without hunting through the full list.
- **US-3.4** — As a User or Leader, I want the home page to show every section of the app as something I can click straight to, so that I don't have to already know the site's structure to get around.
- **US-3.5** — As a User or Leader, I want the app to look modern and consistent from page to page, so that it feels like one coherent product rather than a set of disconnected screens.

## Notes

- The AI Agent is a system actor, not a persona — its behavior appears in stories from the User's or Leader's point of view (what they get out of it), not as its own "As an AI Agent..." stories.
- Phase 1 stories are the demo-complete bar. Phase 2/3 stories are written now so scaffolding doesn't have to be reworked to fit them later, per the cross-phase design constraint in [00-idea-capture.md](./00-idea-capture.md).
- **US-1.2 revision note**: the original version of this story ("show all six fields in the list") was reversed after Milestones 1–4 were already built and tested against it. That behavior didn't disappear — it moved to **US-1.14**, the event's own page. The revision is deliberate, not a correction of a mistake: showing full detail per list item was fine for a demo with a handful of seeded events, but doesn't scale as a pattern, and a minimal-list/full-detail split is the more standard shape for this kind of UI. See `docs/04-test-scenario-inventory.md` for how the existing TC-1.2-01/02/03 tests (already referenced by file/line in `EventCard.test.ts`) were reassigned to US-1.14 without renumbering them, to avoid unnecessary churn on passing tests.
- **US-3.4/US-3.5 are cross-cutting UI work**, not new product features — they were assigned Phase 3 IDs because they fit the existing "Beautification" theme, but they're scheduled to build *before* the Phase-3 calendar/chart/needs-voting stories (US-3.1–3.3) in the milestone build order — see `docs/07-milestones.md` Milestone 5 vs. 6. Phase numbering (product grouping) and Milestone numbering (build order) are allowed to diverge like this; they're two different axes.
