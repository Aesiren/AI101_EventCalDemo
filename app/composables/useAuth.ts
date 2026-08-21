// Mock login only (US-1.13) — see docs/05-spec.md and server/api/auth/login.post.ts.
// Holds the current account in reactive client state for the current page session. A hard
// refresh resets it: there's no session-restore endpoint, which is a deliberate scope decision
// (no story requires persisting login across a reload), not an oversight.

import type { Account, LoginRequest } from '../../shared/types'

export function useAuth() {
  const currentAccount = useState<Account | null>('currentAccount', () => null)

  const isLeader = computed(() => currentAccount.value?.role === 'Leader')

  // `fetcher` defaults to the real global $fetch; tests pass a mock directly instead of relying
  // on Nuxt's auto-import mocking (which doesn't reliably intercept $fetch — see the linked
  // upstream issue in the test file).
  async function login(name: string, fetcher: typeof $fetch = $fetch): Promise<Account> {
    const account = await fetcher<Account>('/api/auth/login', {
      method: 'POST',
      body: { name } satisfies LoginRequest
    })
    currentAccount.value = account
    return account
  }

  function logout() {
    currentAccount.value = null
  }

  // Lets the login page offer a dropdown of real seeded accounts instead of free-text entry
  // (avoids typos, and closes the account-listing gap flagged back in Milestone 2 step 1).
  async function listAccounts(fetcher: typeof $fetch = $fetch): Promise<Account[]> {
    return fetcher<Account[]>('/api/auth/accounts')
  }

  return {
    currentAccount,
    isLeader,
    login,
    logout,
    listAccounts
  }
}
