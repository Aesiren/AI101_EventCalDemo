// Shared shapes between the Nuxt app and the Nitro server.
// Source of truth: docs/05-spec.md (data model) and docs/06-scaffolding-plan.md (interface contracts).

export type Role = 'User' | 'Leader'

export interface Account {
  id: string
  name: string
  role: Role
}

// Fixed category list, confirmed in docs/00-idea-capture.md.
export const EVENT_TYPES = [
  'Social',
  'Training',
  'Fundraiser',
  'Community Service',
  'Sports/Recreation',
  'Other'
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export interface Event {
  id: string
  name: string
  location: string
  type: EventType
  description: string
  /** ISO 8601 timestamp. Single required date+time field (see docs/05-spec.md). */
  dateTime: string
  /** Defaults false on creation; settable only by a Leader. */
  baseSupport: boolean
  /** Defaults false on creation; settable only by a Leader (US-2.6). */
  resourcesCommitted: boolean
  submittedBy: string // Account id
  /** ISO 8601 timestamp, stamped from an injectable clock — not read from the system clock directly. */
  createdAt: string
}

// Fields a caller supplies when creating an event. id/baseSupport/resourcesCommitted/createdAt
// are always assigned by the store, never by the caller.
export interface NewEventInput {
  name: string
  location: string
  type: EventType
  description: string
  dateTime: string
  submittedBy: string
}

export type InterestKind = 'vote' | 'volunteer'

// One record per (accountId, eventId) pair — this is what makes "one vote per user per event"
// (US-2.2) and "voting/volunteering are mutually exclusive" (US-2.3) correct by construction.
export interface Interest {
  accountId: string
  eventId: string
  kind: InterestKind
}

// Discriminated union so a 'clear' result can't carry a stray guideline/message by mistake.
export type GuidelineResult =
  | { status: 'clear' }
  | { status: 'correctable'; guideline: string; message: string }
  | { status: 'rejected'; guideline: string; message: string }
