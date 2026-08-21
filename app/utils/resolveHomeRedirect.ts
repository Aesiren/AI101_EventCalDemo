// Pure decision logic for app/pages/index.vue: does a visitor need to be sent to /login? Kept
// separate from navigateTo so it's directly testable without any Nuxt routing machinery — same
// reasoning as app/middleware/requireLeader.ts's resolveLeaderRedirect.
//
// A logged-in visitor gets null (no redirect) — index.vue is a real home page now, not a forced
// hand-off to /events; the site-wide header nav (app/layouts/default.vue) handles getting
// anywhere else.

import type { Account } from '../../shared/types'

export function resolveHomeRedirect(account: Account | null): string | null {
  return account ? null : '/login'
}
