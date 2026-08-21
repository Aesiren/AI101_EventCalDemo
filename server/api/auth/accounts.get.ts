// Lists the seeded accounts (for the login page's dropdown — see useAuth.listAccounts()).
// Open/no auth required — these are just the pre-seeded demo identities, not sensitive.

import { store } from '../../utils/store'

export default defineEventHandler(() => {
  return store.listAccounts()
})
