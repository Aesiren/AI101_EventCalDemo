// Mock login (US-1.13) — no real credential security. Client sends the account's display name;
// we match it against the seeded accounts and, on success, remember the account id in a cookie
// so later requests (e.g. requireLeader) know who's "logged in" without a real session system.

import type { LoginRequest } from '../../../shared/types'
import { store } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginRequest>(event)
  const name = body?.name?.trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Account name is required' })
  }

  const account = store.findAccountByName(name)
  if (!account) {
    throw createError({ statusCode: 404, statusMessage: `No account found named "${name}"` })
  }

  setCookie(event, 'accountId', account.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  })

  return account
})
