// Wraps the /api/events* routes for the UI layer (FR-1, FR-2). Nothing under app/ talks to
// server/utils/* directly — this composable is the only path from pages/components to the API.

import type { CreateEventInput, Event, EventInterestSummary, InterestKind } from '../../shared/types'

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

  // For the event detail page — independent of the `events` list state, same as useAuth's
  // listAccounts().
  async function fetchEvent(id: string, fetcher: typeof $fetch = $fetch): Promise<Event> {
    return fetcher<Event>(`/api/events/${id}`)
  }

  // Leader-only (US-1.12) — the route itself enforces that; this just calls it and keeps the
  // `events` list in sync so BaseSupportToggle's parent list re-renders without a full refresh().
  async function setBaseSupport(id: string, baseSupport: boolean, fetcher: typeof $fetch = $fetch): Promise<Event> {
    const updated = await fetcher<Event>(`/api/events/${id}/support`, {
      method: 'PATCH',
      body: { baseSupport }
    })
    events.value = events.value.map(e => (e.id === id ? updated : e))
    return updated
  }

  // Leader-only (US-2.6) — mirrors setBaseSupport exactly.
  async function setResourcesCommitted(
    id: string,
    resourcesCommitted: boolean,
    fetcher: typeof $fetch = $fetch
  ): Promise<Event> {
    const updated = await fetcher<Event>(`/api/events/${id}/resources`, {
      method: 'PATCH',
      body: { resourcesCommitted }
    })
    events.value = events.value.map(e => (e.id === id ? updated : e))
    return updated
  }

  // For VoteControls (US-2.1-2.4) — deliberately separate from the Event fetches above rather
  // than embedding vote info directly on Event; see shared/types.ts's EventInterestSummary note.
  async function fetchInterest(id: string, fetcher: typeof $fetch = $fetch): Promise<EventInterestSummary> {
    return fetcher<EventInterestSummary>(`/api/events/${id}/interest`)
  }

  // One call for both vote and volunteer — the route path is just the kind, matching how
  // vote.post.ts/volunteer.post.ts are named.
  async function castInterest(id: string, kind: InterestKind, fetcher: typeof $fetch = $fetch): Promise<Event> {
    return fetcher<Event>(`/api/events/${id}/${kind}`, { method: 'POST' })
  }

  // For the chart and needs-voting views (US-3.2, US-3.3, Milestone 6) — both need every event's
  // interest summary at once to rank/filter with. Deliberately composed from the existing
  // per-event fetchInterest() (Promise.all over the current `events` list) rather than a new bulk
  // API route — Milestone 6 is scoped as "no new server contracts expected", and the seeded demo
  // data is small enough that N parallel requests is a non-issue. Assumes refresh() has already
  // populated `events`.
  async function fetchAllInterests(fetcher: typeof $fetch = $fetch): Promise<Record<string, EventInterestSummary>> {
    const entries = await Promise.all(
      events.value.map(async event => [event.id, await fetchInterest(event.id, fetcher)] as const)
    )
    return Object.fromEntries(entries)
  }

  return {
    events,
    refresh,
    createEvent,
    fetchEvent,
    setBaseSupport,
    setResourcesCommitted,
    fetchInterest,
    castInterest,
    fetchAllInterests
  }
}
