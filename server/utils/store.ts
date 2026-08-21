// In-memory data store — single source of truth for the demo (see docs/05-spec.md, "Persistence").
// Contract: docs/06-scaffolding-plan.md. Never imported by anything under app/ — API routes are
// the only callers, which keeps this (and everything downstream of it) server-only.

import type { Account, Event, Interest, InterestKind, NewEventInput } from '../../shared/types'
import { seedDemoData } from './seed'

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'user-1', name: 'Casey Rivera', role: 'User' },
  { id: 'user-2', name: 'Jordan Blake', role: 'User' },
  { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }
]

export interface StoreOptions {
  /** Injectable clock so createdAt is deterministic in tests. Defaults to the system clock. */
  now?: () => Date
  /** Override the seeded accounts (mainly for test isolation). */
  accounts?: Account[]
}

/**
 * Creates an isolated store instance. A single shared instance (`store`, below) is what
 * server/api routes use; tests create their own instances so nothing leaks between them.
 */
export function createStore(options: StoreOptions = {}) {
  const now = options.now ?? (() => new Date())
  const accounts: Account[] = (options.accounts ?? DEFAULT_ACCOUNTS).map(a => ({ ...a }))
  const events: Event[] = []
  const interests: Interest[] = []

  let nextEventId = 1

  function listAccounts(): Account[] {
    return accounts.map(a => ({ ...a }))
  }

  function findAccountByName(name: string): Account | undefined {
    const normalized = name.trim().toLowerCase()
    const account = accounts.find(a => a.name.toLowerCase() === normalized)
    return account ? { ...account } : undefined
  }

  function listEvents(): Event[] {
    return events.map(e => ({ ...e }))
  }

  function findEvent(eventId: string): Event | undefined {
    return events.find(e => e.id === eventId)
  }

  function getEvent(eventId: string): Event | undefined {
    const event = findEvent(eventId)
    return event ? { ...event } : undefined
  }

  function requireEvent(eventId: string): Event {
    const event = findEvent(eventId)
    if (!event) {
      throw new Error(`Event not found: ${eventId}`)
    }
    return event
  }

  function createEvent(input: NewEventInput): Event {
    const event: Event = {
      id: `event-${nextEventId++}`,
      name: input.name,
      location: input.location,
      type: input.type,
      description: input.description,
      dateTime: input.dateTime,
      submittedBy: input.submittedBy,
      baseSupport: false,
      resourcesCommitted: false,
      createdAt: now().toISOString()
    }
    events.push(event)
    return { ...event }
  }

  function setBaseSupport(eventId: string, value: boolean): Event {
    const event = requireEvent(eventId)
    event.baseSupport = value
    return { ...event }
  }

  function setResourcesCommitted(eventId: string, value: boolean): Event {
    const event = requireEvent(eventId)
    event.resourcesCommitted = value
    return { ...event }
  }

  function castInterest(accountId: string, eventId: string, kind: InterestKind): Event {
    const event = requireEvent(eventId)
    if (event.submittedBy === accountId) {
      throw new Error('A user cannot vote or volunteer on their own submitted event')
    }
    const existing = interests.find(i => i.accountId === accountId && i.eventId === eventId)
    if (existing) {
      existing.kind = kind
    } else {
      interests.push({ accountId, eventId, kind })
    }
    return { ...event }
  }

  function listInterests(): Interest[] {
    return interests.map(i => ({ ...i }))
  }

  function getVoteCount(eventId: string): number {
    return interests.filter(i => i.eventId === eventId && i.kind === 'vote').length
  }

  function getMyInterest(accountId: string, eventId: string): InterestKind | null {
    const found = interests.find(i => i.accountId === accountId && i.eventId === eventId)
    return found ? found.kind : null
  }

  function getVolunteers(eventId: string): string[] {
    return interests.filter(i => i.eventId === eventId && i.kind === 'volunteer').map(i => i.accountId)
  }

  return {
    listAccounts,
    findAccountByName,
    listEvents,
    getEvent,
    createEvent,
    setBaseSupport,
    setResourcesCommitted,
    castInterest,
    listInterests,
    getVoteCount,
    getMyInterest,
    getVolunteers
  }
}

export type Store = ReturnType<typeof createStore>

/** The single shared instance used by server/api routes. */
export const store = createStore()

// Demo fixture data — see seed.ts for what's seeded and why. Only ever applied to this
// singleton, never to createStore() itself, so every test's "starts empty" assumption holds.
seedDemoData(store)
