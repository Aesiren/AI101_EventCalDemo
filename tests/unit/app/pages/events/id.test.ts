import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EventDetailPage from '../../../../../app/pages/events/[id].vue'
import type { Account, Event } from '../../../../../shared/types'

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

const ACCOUNTS: Account[] = [
  { id: 'user-1', name: 'Casey Rivera', role: 'User' },
  { id: 'user-2', name: 'Jordan Blake', role: 'User' }
]

const fetchEventMock = vi.fn()
const listAccountsMock = vi.fn().mockResolvedValue(ACCOUNTS)
const fetchInterestMock = vi.fn().mockResolvedValue({ voteCount: 0, myInterest: null })

vi.mock('../../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: { value: [] },
    refresh: vi.fn(),
    createEvent: vi.fn(),
    fetchEvent: fetchEventMock,
    setBaseSupport: vi.fn(),
    fetchInterest: fetchInterestMock,
    castInterest: vi.fn()
  })
}))

// VoteControls renders for real on this page (not mocked out), and both it and the submitter-name
// lookup need useAuth — see BaseSupportToggle.test.ts for why real refs matter here.
vi.mock('../../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: ref({ id: 'user-2', name: 'Jordan Blake', role: 'User' }),
    isLeader: ref(false),
    login: vi.fn(),
    logout: vi.fn(),
    listAccounts: listAccountsMock
  })
}))

describe('event detail page', () => {
  it('fetches and renders the event matching the route id', async () => {
    fetchEventMock.mockResolvedValue(EVENT_A)
    const wrapper = await mountSuspended(EventDetailPage, { route: '/events/event-1' })

    expect(fetchEventMock).toHaveBeenCalledWith('event-1')
    expect(wrapper.text()).toContain('Community Cookout')
  })

  it('shows who submitted the event, resolved from their account id', async () => {
    fetchEventMock.mockResolvedValue(EVENT_A)
    const wrapper = await mountSuspended(EventDetailPage, { route: '/events/event-1' })

    expect(wrapper.text()).toContain('Submitted by Casey Rivera')
  })

  it('shows vote/volunteer controls for a non-owner viewer', async () => {
    fetchEventMock.mockResolvedValue(EVENT_A)
    const wrapper = await mountSuspended(EventDetailPage, { route: '/events/event-1' })
    await flushPromises()

    expect(wrapper.find('[data-action="vote"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="volunteer"]').exists()).toBe(true)
  })

  it('shows a not-found message when the event does not exist', async () => {
    fetchEventMock.mockRejectedValue(new Error('404 not found'))
    const wrapper = await mountSuspended(EventDetailPage, { route: '/events/nope' })

    expect(wrapper.text()).toMatch(/not found/i)
  })
})
