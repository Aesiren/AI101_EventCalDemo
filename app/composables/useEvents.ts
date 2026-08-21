// Wraps the /api/events* routes for the UI layer (FR-1, FR-2). Nothing under app/ talks to
// server/utils/* directly — this composable is the only path from pages/components to the API.

import type { CreateEventInput, Event } from '../../shared/types'

export function useEvents() {
  const events = useState<Event[]>('events', () => [])

  // fetcher defaults to the real global $fetch; tests pass a mock directly — same reasoning as
  // useAuth's login().
  async function refresh(fetcher: typeof $fetch = $fetch): Promise<Event[]> {
    const result = await fetcher<Event[]>('/api/events')
    events.value = result
    return result
  }

  async function createEvent(input: CreateEventInput, fetcher: typeof $fetch = $fetch): Promise<Event> {
    const created = await fetcher<Event>('/api/events', {
      method: 'POST',
      body: input
    })
    events.value = [...events.value, created]
    return created
  }

  return {
    events,
    refresh,
    createEvent
  }
}
