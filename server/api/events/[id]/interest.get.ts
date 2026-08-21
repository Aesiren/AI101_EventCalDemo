// Vote count + the current viewer's own interest for one event (US-2.1–US-2.4). Open/no auth
// required for viewing — same posture as the other GET routes; myInterest is just null when
// nobody's logged in. Volunteer names are additionally included, but only when the viewer is a
// Leader — everyone else gets the same open response as before.

import type { EventInterestSummary } from '../../../../shared/types'
import { store } from '../../../utils/store'

export default defineEventHandler((event): EventInterestSummary => {
  const eventId = getRouterParam(event, 'id')
  if (!eventId || !store.getEvent(eventId)) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  const accountId = getCookie(event, 'accountId')
  const account = accountId ? (store.listAccounts().find(a => a.id === accountId) ?? null) : null

  const summary: EventInterestSummary = {
    voteCount: store.getVoteCount(eventId),
    myInterest: account ? store.getMyInterest(account.id, eventId) : null
  }

  if (account?.role === 'Leader') {
    const accounts = store.listAccounts()
    summary.volunteers = store
      .getVolunteers(eventId)
      .map(volunteerId => accounts.find(a => a.id === volunteerId)?.name ?? 'Unknown')
  }

  return summary
})
