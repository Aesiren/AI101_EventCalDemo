// Pure filter for the needs-voting view (US-3.3, FR-12): events the current account hasn't voted
// or volunteered on yet, newest first. Confirmed reading (docs/03-acceptance-criteria.md): "hasn't
// voted" means no recorded Interest at all, not "zero votes total" — so a well-supported event the
// viewer personally hasn't weighed in on still needs their vote.
//
// `myInterestByEventId` is caller-supplied (from EventInterestSummary.myInterest per event — see
// shared/types.ts) rather than fetched here, keeping this a plain synchronous function, same as
// rankEventsByVotes/groupEventsByDate.
//
// Design decision (not separately called out in the ACs, but follows directly from the rest of
// the app): the viewer's own submitted events are excluded. Self-voting is blocked everywhere
// else (store.ts's castInterest, VoteControls.vue hiding itself) — surfacing an event here that
// the viewer can never actually vote on would be a dead end, not a to-do.
//
// Volunteering counts as having voted here too, consistent with the vote-count change: since
// castInterest records one Interest per (account, event) with kind 'vote' | 'volunteer', and
// volunteering is a stronger form of support rather than an alternative to voting (see
// docs/02-user-stories.md's US-2.3 revision note), any non-null myInterest — vote or volunteer —
// means this event no longer needs the viewer's vote.

import type { Event, InterestKind } from '../types'

export function filterNeedsVoting(
  events: Event[],
  currentAccountId: string,
  myInterestByEventId: Record<string, InterestKind | null | undefined>
): Event[] {
  return events
    .filter(e => e.submittedBy !== currentAccountId)
    .filter(e => !myInterestByEventId[e.id])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
