// Shared shapes between the Nuxt app and the Nitro server.
// Source of truth: docs/05-spec.md (data model) and docs/06-scaffolding-plan.md (interface contracts).

export type Role = 'User' | 'Leader'

export interface Account {
  id: string
  name: string
  role: Role
}

// Mock login only (US-1.13) — no real credential security. The client types the account's
// display name (e.g. "Casey Rivera"); the server matches it against the seeded accounts
// (case-insensitive) and returns the matching Account. No token/session shape needed: the
// current account id is carried in a cookie after login, and the response here is the Account
// itself.
export interface LoginRequest {
  name: string
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

// The request body for POST /api/events — everything in NewEventInput except submittedBy, which
// the server derives from the login cookie rather than trusting the client to supply it (a
// client-supplied submittedBy would let anyone submit "as" someone else, undermining the
// self-vote-block invariant in store.ts).
export type CreateEventInput = Omit<NewEventInput, 'submittedBy'>

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

// One turn of the AI-assisted submission flow (server/utils/agent.ts). Just a data shape — no
// guideline text or prompt content lives in this type, so it's safe for the client to know about.
export interface AgentTurnResult {
  proposedFields: Partial<CreateEventInput>
  missingFields: (keyof CreateEventInput)[]
  guidelineResult: GuidelineResult
  /** Present whenever readyToSubmit is false — what to ask/tell the user next. */
  followUpQuestion?: string
  readyToSubmit: boolean
}
