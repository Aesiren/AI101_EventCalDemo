// Pure ranking helper for the chart view (US-3.2, FR-11). `voteCounts` is a caller-supplied map
// (eventId -> total, from EventInterestSummary.voteCount — see shared/types.ts) rather than
// something this function fetches itself, so it stays a plain, synchronous, easily-tested
// function with no network dependency, same as groupEventsByDate/filterNeedsVoting.
//
// Ties are broken by insertion order (TC-3.2-02, confirmed in docs/04-test-scenario-inventory.md)
// — Array.prototype.sort is a stable sort (guaranteed since ES2019), so sorting the `events` array
// as given (already insertion order, since store.ts only ever appends) naturally preserves that
// order for equal vote counts without any extra tie-break logic.

import type { Event } from '../types'

export interface RankedEvent {
  event: Event
  voteCount: number
}

export function rankEventsByVotes(events: Event[], voteCounts: Record<string, number>): RankedEvent[] {
  return events
    .map(event => ({ event, voteCount: voteCounts[event.id] ?? 0 }))
    .sort((a, b) => b.voteCount - a.voteCount)
}
