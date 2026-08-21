// Presence validation for a new event submission (FR-2, US-1.4). Deliberately presence-only, no
// length/format rules — see docs/04-test-scenario-inventory.md: "no min/max length or character
// rules exist for this demo." Pure function, no framework dependency — lives in shared/ (not
// server/utils/) because both the server route (defense in depth) and EventForm.vue (immediate
// UI feedback) need the identical rule, and duplicating it would let the two drift apart.

import type { CreateEventInput } from './types'
import { EVENT_TYPES } from './types'

// On success, `value` carries the input narrowed to CreateEventInput — so callers don't need
// non-null assertions to use it, the type system proves it's safe.
export type EventValidationResult =
  | { valid: true; errors: []; value: CreateEventInput }
  | { valid: false; errors: string[] }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateCreateEventInput(input: Record<string, unknown>): EventValidationResult {
  const errors: string[] = []

  if (!isNonEmptyString(input.name)) {
    errors.push('name is required')
  }
  if (!isNonEmptyString(input.location)) {
    errors.push('location is required')
  }
  if (!isNonEmptyString(input.description)) {
    errors.push('description is required')
  }
  if (!isNonEmptyString(input.dateTime)) {
    errors.push('dateTime is required')
  }

  if (!isNonEmptyString(input.type)) {
    errors.push('type is required')
  } else if (!(EVENT_TYPES as readonly string[]).includes(input.type)) {
    errors.push('type must be one of the fixed event categories')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors: [],
    value: input as CreateEventInput
  }
}
