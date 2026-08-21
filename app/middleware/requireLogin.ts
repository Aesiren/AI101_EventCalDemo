// Login-required route guard, for pages that are inherently viewer-specific rather than
// Leader-specific — currently just needs-voting.vue (US-3.3), which can't mean anything without
// knowing who "the current user" is. Applied via
// definePageMeta({ middleware: 'require-login' }) (kebab-case — see requireLeader.ts's note on
// Nuxt's filename normalization).

import type { Account } from '../../shared/types'

/**
 * Pure decision logic, kept separate from defineNuxtRouteMiddleware/navigateTo so it's directly
 * testable without any Nuxt routing machinery — same reasoning as requireLeader.ts's
 * resolveLeaderRedirect. Deliberately its own function rather than reusing
 * app/utils/resolveHomeRedirect.ts, even though the two currently compute the same thing — that's
 * a coincidence of today's requirements (both happen to be "logged in or not"), not a rule that
 * should couple a page's own gate to a generic route guard.
 */
export function resolveLoginRedirect(account: Account | null): string | null {
  return account ? null : '/login'
}

export default defineNuxtRouteMiddleware(() => {
  const { currentAccount } = useAuth()
  const redirectTo = resolveLoginRedirect(currentAccount.value)
  if (redirectTo) {
    return navigateTo(redirectTo)
  }
})
