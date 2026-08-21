import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../../../app/composables/useAuth'
import type { Account } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

// useState() is a Nuxt-app-scoped singleton keyed by name, so explicitly reset it before every
// test rather than relying on test-runner isolation to do it for us.
beforeEach(() => {
  useAuth().logout()
})

describe('useAuth', () => {
  it('starts with no current account', () => {
    const { currentAccount, isLeader } = useAuth()
    expect(currentAccount.value).toBeNull()
    expect(isLeader.value).toBe(false)
  })

  it('logs in by posting the name to /api/auth/login and stores the returned account', async () => {
    // login() takes an injectable fetcher rather than relying on Nuxt's $fetch auto-import
    // being mockable — see github.com/nuxt/test-utils/issues/291 for why that path is unreliable.
    const fetchMock = vi.fn().mockResolvedValue(USER)

    const { currentAccount, login } = useAuth()
    const account = await login('Casey Rivera', fetchMock as never)

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { name: 'Casey Rivera' }
    })
    expect(account).toEqual(USER)
    expect(currentAccount.value).toEqual(USER)
  })

  it('reflects a Leader account via isLeader', async () => {
    const { isLeader, login } = useAuth()
    await login('Morgan Hayes', vi.fn().mockResolvedValue(LEADER) as never)
    expect(isLeader.value).toBe(true)
  })

  it('reflects a User account via isLeader (false)', async () => {
    const { isLeader, login } = useAuth()
    await login('Casey Rivera', vi.fn().mockResolvedValue(USER) as never)
    expect(isLeader.value).toBe(false)
  })

  it('does not set currentAccount when login fails', async () => {
    const { currentAccount, login } = useAuth()
    const failingFetch = vi.fn().mockRejectedValue(new Error('404 not found'))
    await expect(login('Nobody', failingFetch as never)).rejects.toThrow()
    expect(currentAccount.value).toBeNull()
  })

  it('logout clears the current account', async () => {
    const { currentAccount, login, logout } = useAuth()
    await login('Casey Rivera', vi.fn().mockResolvedValue(USER) as never)
    expect(currentAccount.value).not.toBeNull()
    logout()
    expect(currentAccount.value).toBeNull()
  })

  it('listAccounts() fetches the seeded account list, for the login dropdown', async () => {
    const fetchMock = vi.fn().mockResolvedValue([USER, LEADER])
    const { listAccounts } = useAuth()

    const accounts = await listAccounts(fetchMock as never)

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/accounts')
    expect(accounts).toEqual([USER, LEADER])
  })
})
