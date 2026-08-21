import { describe, expect, it } from 'vitest'
import { resolveLoginRedirect } from '../../../../app/middleware/requireLogin'
import type { Account } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }

// Tested as a pure function, deliberately separate from defineNuxtRouteMiddleware/navigateTo —
// same reasoning as requireLeader.ts's resolveLeaderRedirect.
describe('resolveLoginRedirect', () => {
  it('redirects to /login when no account is logged in', () => {
    expect(resolveLoginRedirect(null)).toBe('/login')
  })

  it('allows any logged-in account through (returns null — no redirect)', () => {
    expect(resolveLoginRedirect(USER)).toBeNull()
  })
})
