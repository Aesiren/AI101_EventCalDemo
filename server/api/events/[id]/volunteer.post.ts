// User volunteers to help run another user's event, instead of voting to participate (FR-8,
// US-2.3). Mirrors vote.post.ts exactly — castInterest's mutual-exclusivity rule (switching kind
// replaces the record rather than adding a second one) is already TDD'd into the store.

import { store } from '../../../utils/store'

export default defineEventHandler((event) => {
  const accountId = getCookie(event, 'accountId')
  if (!accountId || !store.listAccounts().some(a => a.id === accountId)) {
    throw createError({ statusCode: 401, statusMessage: 'You must be logged in to volunteer' })
  }

  const eventId = getRouterParam(event, 'id')
  const targetEvent = eventId ? store.getEvent(eventId) : undefined
  if (!targetEvent) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  if (targetEvent.submittedBy === accountId) {
    throw createError({ statusCode: 403, statusMessage: 'You cannot volunteer for your own submitted event' })
  }

  return store.castInterest(accountId, eventId as string, 'volunteer')
})
