// Leader toggles Base support on an event (FR-5, US-1.12). Body: { baseSupport: boolean }.

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
  const body = await readBody<{ baseSupport?: unknown }>(event)
  if (!id || typeof body?.baseSupport !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'baseSupport (boolean) is required' })
  }

  try {
    return store.setBaseSupport(id, body.baseSupport)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }
})
