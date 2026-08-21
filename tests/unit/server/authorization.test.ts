import { describe, expect, it } from 'vitest'
import { checkLeaderAccess } from '../../../server/utils/authorization'
import type { Account } from '../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

// Pure decision logic, same pattern as resolveLeaderRedirect/resolveHomeRedirect — kept separate
// from cookie-reading and createError so the 401-vs-403 distinction is directly testable.
describe('checkLeaderAccess', () => {
  it('is a 401 (not logged in) when there is no account', () => {
    const result = checkLeaderAccess(null)
    expect(result).toEqual({ ok: false, statusCode: 401, message: 'You must be logged in' })
  })

  it('is a 403 (wrong role) for a logged-in User account', () => {
    const result = checkLeaderAccess(USER)
    expect(result).toEqual({ ok: false, statusCode: 403, message: 'Leader role required' })
  })

  it('is ok, carrying the account, for a Leader account', () => {
    const result = checkLeaderAccess(LEADER)
    expect(result).toEqual({ ok: true, account: LEADER })
  })
})
