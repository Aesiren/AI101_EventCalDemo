import { describe, expect, it } from 'vitest'
import { resolveLeaderRedirect } from '../../../../app/middleware/requireLeader'
import type { Account } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

// Tested as a pure function, deliberately separate from defineNuxtRouteMiddleware/navigateTo —
// same reasoning as useAuth's injectable fetcher: don't depend on Nuxt's auto-import machinery
// for logic that doesn't actually need it.
describe('resolveLeaderRedirect', () => {
  it('redirects to /login when no account is logged in', () => {
    expect(resolveLeaderRedirect(null)).toBe('/login')
  })

  it('redirects a non-Leader account to / (US-1.13, TC-1.13-03)', () => {
    expect(resolveLeaderRedirect(USER)).toBe('/')
  })

  it('allows a Leader account through (returns null — no redirect)', () => {
    expect(resolveLeaderRedirect(LEADER)).toBeNull()
  })
})
