import { describe, expect, it } from 'vitest'
import { groupEventsByDate, filterEventsOnDate, toDateKey } from '../../../../shared/utils/groupEventsByDate'
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

// September 2026 has 30 days — a fixed reference date keeps this deterministic (same reasoning
// as store.ts's injectable clock: never read the system clock directly inside a pure function).
const SEPTEMBER_2026 = new Date('2026-09-15T12:00:00.000Z')

describe('groupEventsByDate', () => {
  it('returns one entry per day of the reference month', () => {
    const days = groupEventsByDate([], SEPTEMBER_2026)
    expect(days).toHaveLength(30)
    expect(days.map(d => d.dayOfMonth)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
  })

  it('places an event on its correct day (TC-3.1-01)', () => {
    const event = makeEvent({ dateTime: '2026-09-15T18:00:00.000Z' })
    const days = groupEventsByDate([event], SEPTEMBER_2026)
    const day15 = days.find(d => d.dayOfMonth === 15)
    expect(day15?.events).toEqual([event])
    expect(days.find(d => d.dayOfMonth === 14)?.events).toEqual([])
  })

  it('renders a day with no events as an empty array, not an error (TC-3.1-02)', () => {
    const days = groupEventsByDate([], SEPTEMBER_2026)
    expect(days.every(d => Array.isArray(d.events) && d.events.length === 0)).toBe(true)
  })

  it('places events on the first and last day of the month correctly (TC-3.1-03)', () => {
    const firstDayEvent = makeEvent({ id: 'event-first', dateTime: '2026-09-01T09:00:00.000Z' })
    const lastDayEvent = makeEvent({ id: 'event-last', dateTime: '2026-09-30T21:00:00.000Z' })
    const days = groupEventsByDate([firstDayEvent, lastDayEvent], SEPTEMBER_2026)
    expect(days.find(d => d.dayOfMonth === 1)?.events).toEqual([firstDayEvent])
    expect(days.find(d => d.dayOfMonth === 30)?.events).toEqual([lastDayEvent])
  })

  it('excludes events from other months', () => {
    const augustEvent = makeEvent({ id: 'event-aug', dateTime: '2026-08-31T09:00:00.000Z' })
    const octoberEvent = makeEvent({ id: 'event-oct', dateTime: '2026-10-01T09:00:00.000Z' })
    const days = groupEventsByDate([augustEvent, octoberEvent], SEPTEMBER_2026)
    expect(days.every(d => d.events.length === 0)).toBe(true)
  })
})

// Both used by calendar.vue's "today" panel (US-3.1, Milestone 7) — a separate concern from the
// navigable month grid above, since "today" stays fixed regardless of which month is being viewed.
describe('toDateKey', () => {
  it('formats a Date as YYYY-MM-DD using local date components', () => {
    expect(toDateKey(new Date(2026, 8, 5))).toBe('2026-09-05') // month is 0-indexed
  })

  it('pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('filterEventsOnDate', () => {
  it('returns events landing on the given date (TC-3.1-06)', () => {
    const onDate = makeEvent({ id: 'event-on', dateTime: '2026-09-15T18:00:00.000Z' })
    const otherDate = makeEvent({ id: 'event-other', dateTime: '2026-09-16T18:00:00.000Z' })
    const result = filterEventsOnDate([onDate, otherDate], SEPTEMBER_2026)
    expect(result).toEqual([onDate])
  })

  it('returns an empty array when nothing lands on the given date (TC-3.1-07)', () => {
    const event = makeEvent({ dateTime: '2026-09-16T18:00:00.000Z' })
    expect(filterEventsOnDate([event], SEPTEMBER_2026)).toEqual([])
  })
})
