import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '../../../../app/pages/index.vue'
import type { Account, Event } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

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

let mockCurrentAccount = ref<Account | null>(null)
let mockIsLeader = ref(false)

vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: mockCurrentAccount,
    isLeader: mockIsLeader,
    login: vi.fn(),
    logout: vi.fn(),
    listAccounts: vi.fn()
  })
}))

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

// Mocking navigateTo rather than letting the real logged-out redirect run — see the note in
// tests/unit/app/layouts/default.test.ts for why (an occasional "history is not defined"
// unhandled rejection under happy-dom).
const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

// The Calendar tile preview shows "today's" events — a fixed system clock keeps that
// deterministic, same reasoning as calendar.test.ts's use of Vitest's fake timers.
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'))
  mockEvents = ref([])
  fetchAllInterestsMock.mockReset().mockResolvedValue({})
})
afterEach(() => {
  vi.useRealTimers()
})

describe('home page', () => {
  it('shows a welcome message and nav for a logged-in User (no redirect away)', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.text()).toContain('Casey Rivera')
    expect(wrapper.find('a[href="/events"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/submit"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(false)
  })

  it('shows a dashboard entry for every Milestone 6 view (US-3.4, calendar/votes/needs-voting)', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('a[href="/calendar"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/votes"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/needs-voting"]').exists()).toBe(true)
  })

  it('also shows a Leader Review link for a logged-in Leader', async () => {
    mockCurrentAccount = ref(LEADER)
    mockIsLeader = ref(true)
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(true)
  })

  it('redirects a logged-out visitor to /login', async () => {
    mockCurrentAccount = ref(null)
    mockIsLeader = ref(false)
    navigateToMock.mockClear()
    await mountSuspended(IndexPage)
    expect(navigateToMock).toHaveBeenCalledWith('/login')
  })

  it('shows today\'s event(s) in the Calendar tile', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    mockEvents = ref([makeEvent({ id: 'event-today', name: 'Todays Idea', dateTime: '2026-09-15T18:00:00.000Z' })])
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('[data-section="calendar-preview"]').text()).toContain('Todays Idea')
  })

  it('shows an explicit empty state in the Calendar tile when nothing is happening today', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    mockEvents = ref([makeEvent({ id: 'event-later', name: 'Later This Month', dateTime: '2026-09-20T18:00:00.000Z' })])
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('[data-section="calendar-preview"]').text()).toMatch(/no events today/i)
  })

  it('shows the top two events, ranked, in the Top Voted tile', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    const low = makeEvent({ id: 'event-low', name: 'Low Interest Idea' })
    const high = makeEvent({ id: 'event-high', name: 'Popular Cookout' })
    const third = makeEvent({ id: 'event-third', name: 'Third Place Idea' })
    mockEvents = ref([low, high, third])
    fetchAllInterestsMock.mockResolvedValue({
      'event-low': { voteCount: 1, myInterest: null },
      'event-high': { voteCount: 5, myInterest: null },
      'event-third': { voteCount: 3, myInterest: null }
    })
    const wrapper = await mountSuspended(IndexPage)
    const preview = wrapper.find('[data-section="top-voted-preview"]')
    expect(preview.text()).toContain('Popular Cookout')
    expect(preview.text()).toContain('Third Place Idea')
    expect(preview.text()).not.toContain('Low Interest Idea')
  })

  it('shows an explicit empty state in the Top Voted tile when there are no events', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    mockEvents = ref([])
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('[data-section="top-voted-preview"]').text()).toMatch(/no events/i)
  })
})
