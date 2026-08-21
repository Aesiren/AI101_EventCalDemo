import { describe, expect, it } from 'vitest'
import { resolveHomeRedirect } from '../../../../app/utils/resolveHomeRedirect'
import type { Account } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

// Tested as a pure function, same reasoning as requireLeader's resolveLeaderRedirect — kept
// separate from navigateTo so it's directly testable without any Nuxt routing machinery.
//
// index.vue is now a real home page, not a forced hand-off to /events (the header nav handles
// getting anywhere else) — so the only redirect this ever produces is the logged-out case.
describe('resolveHomeRedirect', () => {
  it('sends a logged-out visitor to /login', () => {
    expect(resolveHomeRedirect(null)).toBe('/login')
  })

  it('does not redirect a logged-in User — the home page renders its own content', () => {
    expect(resolveHomeRedirect(USER)).toBeNull()
  })

  it('does not redirect a logged-in Leader either', () => {
    expect(resolveHomeRedirect(LEADER)).toBeNull()
  })
})
