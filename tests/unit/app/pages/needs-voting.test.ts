import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import NeedsVotingPage from '../../../../app/pages/needs-voting.vue'
import type { Account, Event } from '../../../../shared/types'

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

const VIEWER: Account = { id: 'user-2', name: 'Jordan Blake', role: 'User' }

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
    fetchInterest: vi.fn().mockResolvedValue({ voteCount: 0, myInterest: null }),
    castInterest: vi.fn(),
    fetchAllInterests: fetchAllInterestsMock
  })
}))

vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: ref(VIEWER),
    isLeader: ref(false),
    login: vi.fn(),
    logout: vi.fn(),
    listAccounts: vi.fn()
  })
}))

describe('needs-voting page', () => {
  it('fetches events and their interest summaries on load', async () => {
    mockEvents = ref([])
    refreshMock.mockClear()
    fetchAllInterestsMock.mockClear().mockResolvedValue({})
    await mountSuspended(NeedsVotingPage)
    expect(refreshMock).toHaveBeenCalled()
    expect(fetchAllInterestsMock).toHaveBeenCalled()
  })

  it('lists events the viewer has not voted or volunteered on, newest first (TC-3.3-01)', async () => {
    const older = makeEvent({ id: 'event-older', name: 'Older Idea', createdAt: '2026-08-01T09:00:00.000Z' })
    const newer = makeEvent({ id: 'event-newer', name: 'Newer Idea', createdAt: '2026-08-10T09:00:00.000Z' })
    mockEvents = ref([older, newer])
    fetchAllInterestsMock.mockResolvedValue({})
    const wrapper = await mountSuspended(NeedsVotingPage)
    const links = wrapper.findAll('a[href^="/events/"]')
    expect(links.map(l => l.text())).toEqual(['Newer Idea', 'Older Idea'])
  })

  it('excludes events the viewer has already voted or volunteered on', async () => {
    const voted = makeEvent({ id: 'event-voted', name: 'Already Voted' })
    const untouched = makeEvent({ id: 'event-untouched', name: 'Needs My Vote' })
    mockEvents = ref([voted, untouched])
    fetchAllInterestsMock.mockResolvedValue({
      'event-voted': { voteCount: 1, myInterest: 'vote' },
      'event-untouched': { voteCount: 0, myInterest: null }
    })
    const wrapper = await mountSuspended(NeedsVotingPage)
    expect(wrapper.text()).toContain('Needs My Vote')
    expect(wrapper.text()).not.toContain('Already Voted')
  })

  it('shows an explicit empty-state message when the viewer has voted on everything (TC-3.3-02)', async () => {
    const voted = makeEvent({ id: 'event-voted' })
    mockEvents = ref([voted])
    fetchAllInterestsMock.mockResolvedValue({ 'event-voted': { voteCount: 1, myInterest: 'vote' } })
    const wrapper = await mountSuspended(NeedsVotingPage)
    expect(wrapper.text()).toMatch(/voted on (everything|every event)/i)
  })
})
