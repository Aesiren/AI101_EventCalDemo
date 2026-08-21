import { describe, expect, it } from 'vitest'
import { rankEventsByVotes } from '../../../../shared/utils/rankEventsByVotes'
import type { Event } from '../../../../shared/types'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    name: 'Community Cookout',
    location: 'Base Pavilion',
    type: 'Social',
    description: 'A casual cookout open to all base members.',
    dateTime: '2026-09-15T18:00:00.000Z',
    submittedBy: 'user-1',
    baseSupport: false,
    resourcesCommitted: false,
    createdAt: '2026-08-21T09:00:00.000Z',
    ...overrides
  }
}

describe('rankEventsByVotes', () => {
  it('ranks events by vote count, highest first (TC-3.2-01)', () => {
    const low = makeEvent({ id: 'event-low' })
    const high = makeEvent({ id: 'event-high' })
    const mid = makeEvent({ id: 'event-mid' })
    const ranked = rankEventsByVotes([low, high, mid], { 'event-low': 1, 'event-high': 5, 'event-mid': 3 })
    expect(ranked.map(r => r.event.id)).toEqual(['event-high', 'event-mid', 'event-low'])
    expect(ranked.map(r => r.voteCount)).toEqual([5, 3, 1])
  })

  it('breaks ties by insertion order — earlier-submitted event first (TC-3.2-02)', () => {
    const earlier = makeEvent({ id: 'event-earlier', createdAt: '2026-08-01T09:00:00.000Z' })
    const later = makeEvent({ id: 'event-later', createdAt: '2026-08-02T09:00:00.000Z' })
    // Both tied at 2 votes; `earlier` appears first in the input array (insertion order).
    const ranked = rankEventsByVotes([earlier, later], { 'event-earlier': 2, 'event-later': 2 })
    expect(ranked.map(r => r.event.id)).toEqual(['event-earlier', 'event-later'])
  })

  it('treats an event missing from the vote-count map as 0 votes', () => {
    const event = makeEvent()
    const ranked = rankEventsByVotes([event], {})
    expect(ranked).toEqual([{ event, voteCount: 0 }])
  })

  it('returns an empty array for no events', () => {
    expect(rankEventsByVotes([], {})).toEqual([])
  })
})
