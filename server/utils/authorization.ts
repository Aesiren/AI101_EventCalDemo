// Server-side authorization decisions. Pure function, separate from cookie-reading and
// createError() — same pattern as app/middleware/requireLeader.ts's resolveLeaderRedirect and
// app/utils/resolveHomeRedirect.ts. Used by Leader-only PATCH routes (support, resourcesCommitted).

import type { Account } from '../../shared/types'

export type LeaderAccessResult =
  | { ok: true; account: Account }
  | { ok: false; statusCode: 401 | 403; message: string }

export function checkLeaderAccess(account: Account | null): LeaderAccessResult {
  if (!account) {
    return { ok: false, statusCode: 401, message: 'You must be logged in' }
  }
  if (account.role !== 'Leader') {
    return { ok: false, statusCode: 403, message: 'Leader role required' }
  }
  return { ok: true, account }
}
