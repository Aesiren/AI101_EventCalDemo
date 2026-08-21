// Pure decision logic for app/pages/index.vue (the home/redirect gate): where should a visitor
// land? Kept separate from navigateTo so it's directly testable without any Nuxt routing
// machinery — same reasoning as app/middleware/requireLeader.ts's resolveLeaderRedirect.

import type { Account } from '../../shared/types'

export function resolveHomeRedirect(account: Account | null): string {
  return account ? '/events' : '/login'
}
