import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EventsIndexPage from '../../../../../app/pages/events/index.vue'
import type { Event } from '../../../../../shared/types'

const EVENT_A: Event = {
  id: 'event-1',
  name: 'Community Cookout',
  location: 'Base Pavilion',
  type: 'Social',
  description: 'A casual cookout open to all base members.',
  dateTime: '2026-09-01T18:00:00.000Z',
  submittedBy: 'user-1',
  baseSupport: false,
  resourcesCommitted: false,
  createdAt: '2026-08-21T09:00:00.000Z'
}

const refreshMock = vi.fn().mockResolvedValue([])
let mockEvents = ref<Event[]>([])

// Same reasoning as EventForm's test: explicit import of useEvents makes this a plain vi.mock,
// no fighting Nuxt's $fetch auto-import. `refresh()` runs at page-load time here (top-level
// await in <script setup>), so unlike EventCard this page can't be tested without mocking it.
vi.mock('../../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: mockEvents,
    refresh: refreshMock,
    createEvent: vi.fn(),
    fetchEvent: vi.fn(),
    setBaseSupport: vi.fn(),
    // VoteControls renders for real inside each event card here (not mocked out) — see its own
    // test file for the behaviors these back.
    fetchInterest: vi.fn().mockResolvedValue({ voteCount: 0, myInterest: null }),
    castInterest: vi.fn()
  })
}))

// VoteControls also calls useAuth() directly — not logged in by default here means it renders
// nothing, keeping this page's own tests focused on the event list itself.
vi.mock('../../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: ref(null),
    isLeader: ref(false),
    login: vi.fn(),
    logout: vi.fn(),
    listAccounts: vi.fn()
  })
}))

describe('events index page', () => {
  it('fetches events on load', async () => {
    mockEvents = ref([])
    refreshMock.mockClear()
    await mountSuspended(EventsIndexPage)
    expect(refreshMock).toHaveBeenCalled()
  })

  it('shows an explicit empty-state message when there are no events (TC-1.1-02)', async () => {
    mockEvents = ref([])
    const wrapper = await mountSuspended(EventsIndexPage)
    expect(wrapper.text()).toMatch(/no events/i)
  })

  it('renders an event card for each submitted event, linked to its detail page (TC-1.1-01)', async () => {
    mockEvents = ref([EVENT_A])
    const wrapper = await mountSuspended(EventsIndexPage)
    expect(wrapper.text()).toContain('Community Cookout')
    expect(wrapper.text()).not.toMatch(/no events/i)
    expect(wrapper.find('a[href="/events/event-1"]').exists()).toBe(true)
  })
})
