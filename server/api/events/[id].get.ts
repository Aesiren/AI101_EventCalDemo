// Single event fetch, for the event detail page (app/pages/events/[id].vue). No auth required —
// same open-viewing posture as the list route.

import { store } from '../../utils/store'

export default defineEventHandler((requestEvent) => {
  const id = getRouterParam(requestEvent, 'id')
  const found = id ? store.getEvent(id) : undefined
  if (!found) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
  return found
})
