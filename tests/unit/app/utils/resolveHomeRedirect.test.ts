import { describe, expect, it } from 'vitest'
import { resolveHomeRedirect } from '../../../../app/utils/resolveHomeRedirect'
import type { Account } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

// Tested as a pure function, same reasoning as requireLeader's resolveLeaderRedirect — kept
// separate from navigateTo so it's directly testable without any Nuxt routing machinery.
describe('resolveHomeRedirect', () => {
  it('sends a logged-out visitor to /login', () => {
    expect(resolveHomeRedirect(null)).toBe('/login')
  })

  it('sends a logged-in User to /events', () => {
    expect(resolveHomeRedirect(USER)).toBe('/events')
  })

  it('sends a logged-in Leader to /events too — role only matters for Leader-only actions', () => {
    expect(resolveHomeRedirect(LEADER)).toBe('/events')
  })
})
