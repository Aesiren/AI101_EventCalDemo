# Problem Framing — Event Calendar Demo

Status: distilled from [00-idea-capture.md](./00-idea-capture.md). Feeds User Stories (Step 3).

## Problem statement

Members of a military base community currently have no lightweight way to propose events, get them checked against base content guidelines before submission, and have base leadership decide whether to officially support them. This demo shows that an AI agent can sit in the submission path itself — helping a user fill out and shape an event idea while enforcing content guidelines in real time — rather than guidelines being enforced only after the fact by a human reviewer. Later phases add community input (voting/volunteering) and better visibility into what's already been decided, so leadership isn't the only signal driving whether an event gets support.

## Personas

**User** (base member submitting an event idea)
- Goal: get an event idea in front of leadership, worded so it doesn't get rejected for an avoidable content issue.
- Wants either a fast manual form, or help getting from a rough idea to a submittable one — including being told concretely what to fix, not just "denied."
- In Phase 2, also acts as a participant/volunteer and voter on other users' ideas.

**Leader** (base leadership reviewing events)
- Goal: decide which submitted events get "Base support" (the demo's stand-in for official backing).
- Needs the event content already guideline-checked before it reaches them — their review is a support/no-support judgment call, not a content moderation pass.
- In Phase 2, also wants visibility into community demand (vote totals) and whether the date/time already has resources committed, before deciding.

**AI Agent** (system actor, not a persona a human occupies)
- Sits inside the User's submission flow. Helps populate event fields, checks content against the fixed guideline list, and either clears the event for submission or pushes back with a specific, correctable objection.
- Must hold to the guidelines even when the input tries to talk it out of them (prompt-injection resistance), since it's effectively a gatekeeper, not just a form-filler.

## Value proposition

The interesting part of this demo isn't the calendar — it's that content-guideline enforcement happens *during* authoring, conversationally, instead of as a rejection after the fact. That's the core thing being demonstrated: an AI agent acting as a guided, guardrailed intake step, not just an autocomplete. Everything in Phase 2/3 (voting, resource visibility, calendar/chart views) is there to show the submitted event flowing into a fuller (but still lightweight) decision-support picture for leadership — not to be a production event-management system.

## Non-goals

Explicitly out of scope, for this demo and for all phases, not just "not yet":

- Real authentication/identity system (mock login only, per [00-idea-capture.md](./00-idea-capture.md)).
- Persistent storage across restarts (in-memory/lightweight-DB only).
- Real payment processing or real-money gambling of any kind.
- Resource management beyond the single "Resources Committed" boolean (no inventory, budgeting, or scheduling engine).
- Multi-base / multi-tenant support — this models one base.
- CI/CD, deployment pipeline, or release process.
- Native mobile app (web only).
- Notifications, email, or messaging integrations.
- Recurring events and timezone handling.
- Production-grade security hardening beyond "reasonably guarded against prompt injection for demonstration purposes."
