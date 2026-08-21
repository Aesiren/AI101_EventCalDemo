// User votes on another user's event (FR-7, US-2.1, US-2.2). castInterest's rules — one record
// per (account, event) pair, self-voting blocked, switching kind replaces rather than duplicates —
// are already TDD'd into the store (Milestone 1). This route just resolves the event up front so
// it can return a clean 404/403 instead of parsing castInterest's thrown error messages.

import { store } from '../../../utils/store'

export default defineEventHandler((event) => {
  const accountId = getCookie(event, 'accountId')
  if (!accountId || !store.listAccounts().some(a => a.id === accountId)) {
    throw createError({ statusCode: 401, statusMessage: 'You must be logged in to vote' })
  }

  const eventId = getRouterParam(event, 'id')
  const targetEvent = eventId ? store.getEvent(eventId) : undefined
  if (!targetEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  if (targetEvent.submittedBy === accountId) {
    throw createError({ statusCode: 403, statusMessage: 'You cannot vote on your own submitted event' })
  }

  return store.castInterest(accountId, eventId as string, 'vote')
})
