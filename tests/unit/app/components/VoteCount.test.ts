import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import VoteCount from '../../../../app/components/VoteCount.vue'
import type { Event } from '../../../../shared/types'

const SOME_EVENT: Event = {
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

const fetchInterestMock = vi.fn()

vi.mock('../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: { value: [] },
    refresh: vi.fn(),
    createEvent: vi.fn(),
    fetchEvent: vi.fn(),
    setBaseSupport: vi.fn(),
    fetchInterest: fetchInterestMock,
    castInterest: vi.fn()
  })
}))

describe('VoteCount', () => {
  it('fetches and displays the vote count for the event (US-2.4, TC-2.4-01)', async () => {
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 4, myInterest: null })
    const wrapper = await mountSuspended(VoteCount, { props: { event: SOME_EVENT } })
    await flushPromises()
    expect(fetchInterestMock).toHaveBeenCalledWith('event-1')
    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).toMatch(/votes/i)
  })

  it('uses singular "vote" for exactly one', async () => {
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 1, myInterest: null })
    const wrapper = await mountSuspended(VoteCount, { props: { event: SOME_EVENT } })
    await flushPromises()
    expect(wrapper.text()).toMatch(/1 vote\b/)
    expect(wrapper.text()).not.toMatch(/1 votes/)
  })

  it('shows 0 votes rather than nothing when no one has voted', async () => {
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 0, myInterest: null })
    const wrapper = await mountSuspended(VoteCount, { props: { event: SOME_EVENT } })
    await flushPromises()
    expect(wrapper.text()).toMatch(/0 votes/)
  })

  it('shows volunteer names when the summary includes them (Leader viewer)', async () => {
    fetchInterestMock.mockClear().mockResolvedValue({
      voteCount: 2,
      myInterest: null,
      volunteers: ['Jordan Blake', 'Morgan Hayes']
    })
    const wrapper = await mountSuspended(VoteCount, { props: { event: SOME_EVENT } })
    await flushPromises()
    expect(wrapper.text()).toContain('Jordan Blake')
    expect(wrapper.text()).toContain('Morgan Hayes')
  })

  it('shows no volunteers section when the summary omits it (non-Leader viewer)', async () => {
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 2, myInterest: null })
    const wrapper = await mountSuspended(VoteCount, { props: { event: SOME_EVENT } })
    await flushPromises()
    expect(wrapper.find('[data-section="volunteers"]').exists()).toBe(false)
  })

  it('shows an explicit "no volunteers yet" message when the Leader-visible list is empty', async () => {
    fetchInterestMock.mockClear().mockResolvedValue({ voteCount: 0, myInterest: null, volunteers: [] })
    const wrapper = await mountSuspended(VoteCount, { props: { event: SOME_EVENT } })
    await flushPromises()
    expect(wrapper.find('[data-section="volunteers"]').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/no volunteers yet/i)
  })
})
