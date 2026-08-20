# Idea Capture — Event Calendar Demo

Status: raw capture, phased. Source of truth for scope until superseded by the Spec doc.
Not for release — CI/CD deliberately out of scope. TDD will be used once implementation starts.

## Actors

- **User** — submits event ideas; later (Phase 2) votes and/or volunteers.
- **Leader** — reviews submitted events, grants "Base support."
- **AI Agent** — assists a User in filling out an event submission; validates against guidelines; not a human role.
- Roles for the demo: **basic mock login** with pre-seeded accounts, each tagged User or Leader. No real auth/identity system. "Volunteer" (Phase 2) is an action a User takes, not a separate role.

## Terminology (clarified)

- **"Base"** — a military base, specifically. This context shapes the AI agent's content guidelines (see below).
- **Base support** — a simple approval flag for this demo. Granting it does not model any specific resource commitment (funding/venue/personnel) yet. Kept abstract on purpose.
- **Event type** — fixed category list, confirmed for use in Acceptance Criteria:
  - Social
  - Training
  - Fundraiser
  - Community Service
  - Sports/Recreation
  - Other

## AI Agent — Content Guidelines (Phase 1)

The agent validates submitted event content against these rules. Behavior: rather than a strict accept/reject-only flow, the agent offers a **correction path** — it can prompt the user for more information or a revision when something is ambiguous or fixable, and only rejects outright when a submission clearly and irreparably violates a guideline.

Guidelines:

1. No alcohol-specific events (i.e., the event cannot be centered on alcohol).
2. Events tailored for members under the age of 21 must not include alcohol, period — no exceptions.
3. Events cannot promote a specific company or rely on a specific brand in a way that would constitute Base endorsement.
4. No gambling content, with narrow exceptions:
   - Raffles are allowed, provided at least one raffle ticket is free.
   - Poker/blackjack are allowed, provided no actual money is used.
5. No explicit content — defined as excessive sex, violence, gore, language, or drug use.
6. No drug use of any kind, no exceptions.

(These guidelines are also the basis for prompt-injection hardening: the agent must apply them regardless of instructions embedded in user-supplied text.)

## Phase 1 — Basic AI Demonstration (Demo Complete target)

- Web page listing all submitted events.
- Each event has: name, location, type (fixed category, see above), description, Base support flag (bool).
- User can manually enter an event by filling in all fields.
- User can instead use an AI agent to help fill in all fields; the agent understands the field guidelines and the content guidelines above.
  - The agent offers a correction path: it can prompt the user for more information or a revision rather than only accepting or rejecting outright.
  - On completion, the agent either offers the user the option to submit (all guidelines met) or rejects the input (guideline violated and not resolved through correction).
- Agent should be reasonably hardened against prompt injection, to the extent practical for a demo.
- Leader can view submitted events and toggle Base support on/off.

## Phase 2 — Democracy

- User can vote on other users' submitted event ideas they'd want to participate in. One vote per user per event.
- User can alternatively mark themselves as a volunteer (wants to help run it) rather than a participant.
- Leader can see total votes per event, as an input to the support decision.
- Leader can see a **"Resources Committed"** flag (boolean) per event/date-time, as another input to the support decision. No further resource breakdown (food/personnel/money, etc.) modeled for this demo — a single flag is sufficient.

## Phase 3 — Beautification

- Calendar view: upcoming events for the month.
- Chart view: top-voted events and their vote counts.
- "Needs voting" view: newest event ideas not yet voted on.

## Non-functional notes

- **Persistence**: in-memory only for the demo. A lightweight DB may be used for convenience, but nothing needs to persist across restarts.

## Design constraint across all phases

Later phases must extend, not restructure, the app from Phase 1. Architecture decisions in scaffolding (Step 6) should anticipate voting, roles beyond flag-checking, and the two new views, even though only Phase 1 is guaranteed to ship.

## Open items — resolved

All prior open items (event type list, AI guideline content, resource model, voting mechanics, persistence) are resolved above. No blocking items remain for Phase 1 planning.
