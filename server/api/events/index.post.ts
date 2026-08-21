// Manual event creation (FR-2, US-1.3, US-1.4). submittedBy comes from the login cookie, never
// from the request body — see the CreateEventInput comment in shared/types.ts for why.

import { validateCreateEventInput } from '../../utils/eventValidation'
import { store } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const accountId = getCookie(event, 'accountId')
  if (!accountId || !store.listAccounts().some(a => a.id === accountId)) {
    throw createError({ statusCode: 401, statusMessage: 'You must be logged in to submit an event' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const result = validateCreateEventInput(body ?? {})
  if (!result.valid) {
    throw createError({ statusCode: 400, statusMessage: result.errors.join(', ') })
  }

  const created = store.createEvent({ ...result.value, submittedBy: accountId })

  setResponseStatus(event, 201)
  return created
})
