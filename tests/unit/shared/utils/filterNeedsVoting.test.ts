import { describe, expect, it } from 'vitest'
import { filterNeedsVoting } from '../../../../shared/utils/filterNeedsVoting'
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

const CURRENT_USER = 'user-2'

describe('filterNeedsVoting', () => {
  it('lists events the current user has not voted or volunteered on (TC-3.3-01)', () => {
    const notVoted = makeEvent({ id: 'event-not-voted' })
    const voted = makeEvent({ id: 'event-voted' })
    const result = filterNeedsVoting([notVoted, voted], CURRENT_USER, { 'event-voted': 'vote' })
    expect(result.map(e => e.id)).toEqual(['event-not-voted'])
  })

  it('excludes events the user has volunteered on too — volunteering counts as having voted', () => {
    const volunteered = makeEvent({ id: 'event-volunteered' })
    const result = filterNeedsVoting([volunteered], CURRENT_USER, { 'event-volunteered': 'volunteer' })
    expect(result).toEqual([])
  })

  it('excludes the current user\'s own submitted events — they can never vote on those', () => {
    const own = makeEvent({ id: 'event-own', submittedBy: CURRENT_USER })
    const result = filterNeedsVoting([own], CURRENT_USER, {})
    expect(result).toEqual([])
  })

  it('sorts remaining events newest first (TC-3.3-01)', () => {
    const older = makeEvent({ id: 'event-older', createdAt: '2026-08-01T09:00:00.000Z' })
    const newer = makeEvent({ id: 'event-newer', createdAt: '2026-08-10T09:00:00.000Z' })
    const result = filterNeedsVoting([older, newer], CURRENT_USER, {})
    expect(result.map(e => e.id)).toEqual(['event-newer', 'event-older'])
  })

  it('returns an empty array when the user has voted on everything (TC-3.3-02)', () => {
    const a = makeEvent({ id: 'event-a' })
    const b = makeEvent({ id: 'event-b' })
    const result = filterNeedsVoting([a, b], CURRENT_USER, { 'event-a': 'vote', 'event-b': 'volunteer' })
    expect(result).toEqual([])
  })
})
