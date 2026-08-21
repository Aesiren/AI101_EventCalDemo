import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import VotesPage from '../../../../app/pages/votes.vue'
import type { Event } from '../../../../shared/types'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    name: 'Community Cookout',
    location: 'Base Pavilion',
    type: 'Social',
    description: 'A casual cookout open to all base members.',
    dateTime: '2026-09-15T18:00:00.000Z',
    submittedBy: 'user-1',
    baseSupport: false,
    resourcesCommitted: false,
    createdAt: '2026-08-21T09:00:00.000Z',
    ...overrides
  }
}

const refreshMock = vi.fn().mockResolvedValue([])
const fetchAllInterestsMock = vi.fn().mockResolvedValue({})
let mockEvents = ref<Event[]>([])

vi.mock('../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: mockEvents,
    refresh: refreshMock,
    createEvent: vi.fn(),
    fetchEvent: vi.fn(),
    setBaseSupport: vi.fn(),
    fetchInterest: vi.fn(),
    castInterest: vi.fn(),
    fetchAllInterests: fetchAllInterestsMock
  })
}))

describe('votes (chart) page', () => {
  it('fetches events and their interest summaries on load', async () => {
    mockEvents = ref([])
    refreshMock.mockClear()
    fetchAllInterestsMock.mockClear().mockResolvedValue({})
    await mountSuspended(VotesPage)
    expect(refreshMock).toHaveBeenCalled()
    expect(fetchAllInterestsMock).toHaveBeenCalled()
  })

  it('shows an explicit empty-state message when there are no events', async () => {
    mockEvents = ref([])
    fetchAllInterestsMock.mockResolvedValue({})
    const wrapper = await mountSuspended(VotesPage)
    expect(wrapper.text()).toMatch(/no events/i)
  })

  it('ranks events by vote count, highest first (TC-3.2-01)', async () => {
    const low = makeEvent({ id: 'event-low', name: 'Low Interest Idea' })
    const high = makeEvent({ id: 'event-high', name: 'Popular Cookout' })
    mockEvents = ref([low, high])
    fetchAllInterestsMock.mockResolvedValue({
      'event-low': { voteCount: 1, myInterest: null },
      'event-high': { voteCount: 5, myInterest: null }
    })
    const wrapper = await mountSuspended(VotesPage)
    const names = wrapper.findAll('[data-rank]').map(el => el.text())
    expect(names[0]).toContain('Popular Cookout')
    expect(names[1]).toContain('Low Interest Idea')
  })

  it('breaks ties by insertion order (TC-3.2-02)', async () => {
    const earlier = makeEvent({ id: 'event-earlier', name: 'Earlier Idea', createdAt: '2026-08-01T09:00:00.000Z' })
    const later = makeEvent({ id: 'event-later', name: 'Later Idea', createdAt: '2026-08-02T09:00:00.000Z' })
    mockEvents = ref([earlier, later])
    fetchAllInterestsMock.mockResolvedValue({
      'event-earlier': { voteCount: 2, myInterest: null },
      'event-later': { voteCount: 2, myInterest: null }
    })
    const wrapper = await mountSuspended(VotesPage)
    const names = wrapper.findAll('[data-rank]').map(el => el.text())
    expect(names[0]).toContain('Earlier Idea')
    expect(names[1]).toContain('Later Idea')
  })
})
