import { describe, expect, it } from 'vitest'
import { createStore } from '../../../server/utils/store'
import type { NewEventInput } from '../../../shared/types'

const FIXED_NOW = new Date('2026-08-21T09:00:00.000Z')

function baseInput(overrides: Partial<NewEventInput> = {}): NewEventInput {
  return {
    name: 'Community Cookout',
    location: 'Base Pavilion',
    type: 'Social',
    description: 'A casual cookout open to all base members.',
    dateTime: '2026-09-01T18:00:00.000Z',
    submittedBy: 'user-1',
    ...overrides
  }
}

describe('store', () => {
  it('lists seeded accounts covering both roles', () => {
    const store = createStore()
    const accounts = store.listAccounts()
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts.some(a => a.role === 'User')).toBe(true)
    expect(accounts.some(a => a.role === 'Leader')).toBe(true)
  })

  it('starts with an empty event list', () => {
    const store = createStore()
    expect(store.listEvents()).toEqual([])
  })

  it('creates an event, defaulting baseSupport and resourcesCommitted to false', () => {
    const store = createStore({ now: () => FIXED_NOW })
    const event = store.createEvent(baseInput())
    expect(event.baseSupport).toBe(false)
    expect(event.resourcesCommitted).toBe(false)
    expect(store.listEvents()).toHaveLength(1)
  })

  it('stamps createdAt from the injected clock, not the system clock', () => {
    const store = createStore({ now: () => FIXED_NOW })
    const event = store.createEvent(baseInput())
    expect(event.createdAt).toBe('2026-08-21T09:00:00.000Z')
  })

  it('stores the submitted fields, including dateTime, unchanged', () => {
    const store = createStore()
    const event = store.createEvent(baseInput({ dateTime: '2026-10-05T14:30:00.000Z' }))
    expect(event.dateTime).toBe('2026-10-05T14:30:00.000Z')
    expect(event.name).toBe('Community Cookout')
    expect(event.type).toBe('Social')
  })

  it('toggles baseSupport on and off', () => {
    const store = createStore()
    const event = store.createEvent(baseInput())
    expect(store.setBaseSupport(event.id, true).baseSupport).toBe(true)
    expect(store.setBaseSupport(event.id, false).baseSupport).toBe(false)
  })

  it('toggles resourcesCommitted on and off (US-2.6)', () => {
    const store = createStore()
    const event = store.createEvent(baseInput())
    expect(store.setResourcesCommitted(event.id, true).resourcesCommitted).toBe(true)
    expect(store.setResourcesCommitted(event.id, false).resourcesCommitted).toBe(false)
  })

  it('records a vote as an Interest', () => {
    const store = createStore()
    const event = store.createEvent(baseInput({ submittedBy: 'user-1' }))
    store.castInterest('user-2', event.id, 'vote')
    expect(store.listInterests()).toEqual([{ accountId: 'user-2', eventId: event.id, kind: 'vote' }])
  })

  it('blocks self-voting (US-2.1)', () => {
    const store = createStore()
    const event = store.createEvent(baseInput({ submittedBy: 'user-1' }))
    expect(() => store.castInterest('user-1', event.id, 'vote')).toThrow()
  })

  it('does not create a duplicate record on a repeat vote — no-op (US-2.2)', () => {
    const store = createStore()
    const event = store.createEvent(baseInput({ submittedBy: 'user-1' }))
    store.castInterest('user-2', event.id, 'vote')
    store.castInterest('user-2', event.id, 'vote')
    expect(store.listInterests()).toHaveLength(1)
  })

  it('switching vote -> volunteer replaces the record rather than adding a second one (US-2.3)', () => {
    const store = createStore()
    const event = store.createEvent(baseInput({ submittedBy: 'user-1' }))
    store.castInterest('user-2', event.id, 'vote')
    store.castInterest('user-2', event.id, 'volunteer')
    const interests = store.listInterests()
    expect(interests).toHaveLength(1)
    expect(interests[0]?.kind).toBe('volunteer')
  })

  it('switching volunteer -> vote also replaces rather than duplicates (US-2.3, reverse direction)', () => {
    const store = createStore()
    const event = store.createEvent(baseInput({ submittedBy: 'user-1' }))
    store.castInterest('user-2', event.id, 'volunteer')
    store.castInterest('user-2', event.id, 'vote')
    const interests = store.listInterests()
    expect(interests).toHaveLength(1)
    expect(interests[0]?.kind).toBe('vote')
  })

  it('keeps separate store instances independent (no shared global state)', () => {
    const storeA = createStore()
    const storeB = createStore()
    storeA.createEvent(baseInput())
    expect(storeA.listEvents()).toHaveLength(1)
    expect(storeB.listEvents()).toHaveLength(0)
  })
})
