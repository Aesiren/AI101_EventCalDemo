import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import VoteControls from '../../../../app/components/VoteControls.vue'
import type { Account, Event } from '../../../../shared/types'

const OWN_EVENT: Event = {
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

const VIEWER: Account = { id: 'user-2', name: 'Jordan Blake', role: 'User' }
const OWNER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }

let mockCurrentAccount = ref<Account | null>(VIEWER)
const fetchInterestMock = vi.fn()
const castInterestMock = vi.fn()

vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: mockCurrentAccount,
    isLeader: ref(false),
    login: vi.fn(),
    logout: vi.fn(),
    listAccounts: vi.fn()
  })
}))

vi.mock('../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: { value: [] },
    refresh: vi.fn(),
    createEvent: vi.fn(),
    fetchEvent: vi.fn(),
    setBaseSupport: vi.fn(),
    fetchInterest: fetchInterestMock,
    castInterest: castInterestMock
  })
}))

describe('VoteControls', () => {
  it('renders nothing on the current user\'s own event (TC-2.1-02, UI layer)', async () => {
    mockCurrentAccount = ref(OWNER)
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 0, myInterest: null })
    const wrapper = await mountSuspended(VoteControls, { props: { event: OWN_EVENT } })
    await flushPromises()
    expect(wrapper.find('button').exists()).toBe(false)
    expect(fetchInterestMock).not.toHaveBeenCalled()
  })

  it('renders nothing when not logged in', async () => {
    mockCurrentAccount = ref(null)
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 0, myInterest: null })
    const wrapper = await mountSuspended(VoteControls, { props: { event: OWN_EVENT } })
    await flushPromises()
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows the vote count and both controls for a non-owner viewer', async () => {
    mockCurrentAccount = ref(VIEWER)
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 3, myInterest: null })
    const wrapper = await mountSuspended(VoteControls, { props: { event: OWN_EVENT } })
    await flushPromises()
    expect(fetchInterestMock).toHaveBeenCalledWith('event-1')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.find('[data-action="vote"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="volunteer"]').exists()).toBe(true)
  })

  it('shows a distinct "already voted" state (TC-2.2-02)', async () => {
    mockCurrentAccount = ref(VIEWER)
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 1, myInterest: 'vote' })
    const wrapper = await mountSuspended(VoteControls, { props: { event: OWN_EVENT } })
    await flushPromises()
    expect(wrapper.find('[data-action="vote"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-action="volunteer"]').attributes('aria-pressed')).toBe('false')
  })

  it('casts a vote and refreshes the summary on click (US-2.1)', async () => {
    mockCurrentAccount = ref(VIEWER)
    fetchInterestMock.mockClear()
    fetchInterestMock.mockResolvedValueOnce({ voteCount: 0, myInterest: null })
    castInterestMock.mockClear().mockResolvedValue(OWN_EVENT)
    const wrapper = await mountSuspended(VoteControls, { props: { event: OWN_EVENT } })
    await flushPromises()

    fetchInterestMock.mockResolvedValueOnce({ voteCount: 1, myInterest: 'vote' })
    await wrapper.find('[data-action="vote"]').trigger('click')
    await flushPromises()

    expect(castInterestMock).toHaveBeenCalledWith('event-1', 'vote')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.find('[data-action="vote"]').attributes('aria-pressed')).toBe('true')
  })

  it('switches to volunteer on click (US-2.3)', async () => {
    mockCurrentAccount = ref(VIEWER)
    fetchInterestMock.mockClear()
    fetchInterestMock.mockResolvedValueOnce({ voteCount: 1, myInterest: 'vote' })
    castInterestMock.mockClear().mockResolvedValue(OWN_EVENT)
    const wrapper = await mountSuspended(VoteControls, { props: { event: OWN_EVENT } })
    await flushPromises()

    fetchInterestMock.mockResolvedValueOnce({ voteCount: 0, myInterest: 'volunteer' })
    await wrapper.find('[data-action="volunteer"]').trigger('click')
    await flushPromises()

    expect(castInterestMock).toHaveBeenCalledWith('event-1', 'volunteer')
    expect(wrapper.find('[data-action="volunteer"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-action="vote"]').attributes('aria-pressed')).toBe('false')
  })
})
