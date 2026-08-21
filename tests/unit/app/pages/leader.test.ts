import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LeaderPage from '../../../../app/pages/leader.vue'
import type { Event } from '../../../../shared/types'

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

// BaseSupportToggle renders for real inside this page (not mocked out) — so both useEvents and
// useAuth need mocking here, using real refs (see the lesson documented in
// BaseSupportToggle.test.ts about plain { value } objects silently breaking v-if).
vi.mock('../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: mockEvents,
    refresh: refreshMock,
    createEvent: vi.fn(),
    fetchEvent: vi.fn(),
    setBaseSupport: vi.fn()
  })
}))

vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: ref(null),
    isLeader: ref(true),
    login: vi.fn(),
    logout: vi.fn(),
    listAccounts: vi.fn()
  })
}))

describe('leader page', () => {
  it('fetches events on load', async () => {
    mockEvents = ref([])
    refreshMock.mockClear()
    await mountSuspended(LeaderPage)
    expect(refreshMock).toHaveBeenCalled()
  })

  it('shows an explicit empty-state message when there are no events', async () => {
    mockEvents = ref([])
    const wrapper = await mountSuspended(LeaderPage)
    expect(wrapper.text()).toMatch(/no events/i)
  })

  it('renders an EventCard and a BaseSupportToggle for each event (US-1.11, US-1.12)', async () => {
    mockEvents = ref([EVENT_A])
    const wrapper = await mountSuspended(LeaderPage)
    expect(wrapper.text()).toContain('Community Cookout')
    expect(wrapper.find('button').exists()).toBe(true)
  })
})
