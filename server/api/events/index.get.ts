// List all submitted events (FR-1, US-1.1). No auth required — viewing is open; only
// role-specific actions (e.g. the Base-support toggle) require being logged in.

import { store } from '../../utils/store'

export default defineEventHandler(() => {
  return store.listEvents()
})
