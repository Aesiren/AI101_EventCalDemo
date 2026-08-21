// Leader toggles Resources Committed on an event (FR-9, US-2.6). Body: { resourcesCommitted: boolean }.
// Mirrors support.patch.ts exactly.

import { checkLeaderAccess } from '../../../utils/authorization'
import { store } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const accountId = getCookie(event, 'accountId')
  const account = accountId ? (store.listAccounts().find(a => a.id === accountId) ?? null) : null

  const access = checkLeaderAccess(account)
  if (!access.ok) {
    throw createError({ statusCode: access.statusCode, statusMessage: access.message })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody<{ resourcesCommitted?: unknown }>(event)
  if (!id || typeof body?.resourcesCommitted !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'resourcesCommitted (boolean) is required' })
  }

  try {
    return store.setResourcesCommitted(id, body.resourcesCommitted)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
})
