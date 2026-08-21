// Leader-only route guard (US-1.13, TC-1.13-03). Applied via
// definePageMeta({ middleware: 'requireLeader' }) on Leader-only pages.

import type { Account } from '../../shared/types'

/**
 * Pure decision logic: where should this account be redirected to, if anywhere, to reach a
 * Leader-only page? Returns null when access is allowed. Kept separate from
 * defineNuxtRouteMiddleware/navigateTo so it's directly testable without any Nuxt routing
 * machinery — same reasoning as useAuth's injectable fetcher.
 */
export function resolveLeaderRedirect(account: Account | null): string | null {
  if (!account) {
    return '/login'
  }
  if (account.role !== 'Leader') {
    return '/'
  }
  return null
}

export default defineNuxtRouteMiddleware(() => {
  const { currentAccount } = useAuth()
  const redirectTo = resolveLeaderRedirect(currentAccount.value)
  if (redirectTo) {
    return navigateTo(redirectTo)
  }
})
