import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CalendarPage from '../../../../app/pages/calendar.vue'
import type { Event } from '../../../../shared/types'

const EVENT_MID_MONTH: Event = {
  id: 'event-1',
  name: 'Community Cookout',
  location: 'Base Pavilion',
  type: 'Social',
  description: 'A casual cookout open to all base members.',
  dateTime: '2026-09-15T18:00:00.000Z',
  submittedBy: 'user-1',
  baseSupport: false,
  resourcesCommitted: false,
  createdAt: '2026-08-21T09:00:00.000Z'
}

const refreshMock = vi.fn().mockResolvedValue([])
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
    fetchAllInterests: vi.fn().mockResolvedValue({})
  })
}))

// The calendar renders "the current month" — a fixed system clock keeps that deterministic, same
// reasoning as store.ts's injectable `now`, just via Vitest's fake timers since a page component
// can't take a constructor parameter the way createStore() can.
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('calendar page', () => {
  it('fetches events on load', async () => {
    mockEvents = ref([])
    refreshMock.mockClear()
    await mountSuspended(CalendarPage)
    expect(refreshMock).toHaveBeenCalled()
  })

  it('shows the current month and year', async () => {
    mockEvents = ref([])
    const wrapper = await mountSuspended(CalendarPage)
    expect(wrapper.text()).toContain('September 2026')
  })

  it('renders every day of the month, including days with no events (TC-3.1-02)', async () => {
    mockEvents = ref([])
    const wrapper = await mountSuspended(CalendarPage)
    expect(wrapper.findAll('[data-day]')).toHaveLength(30)
  })

  it('places an event on its correct day (TC-3.1-01)', async () => {
    mockEvents = ref([EVENT_MID_MONTH])
    const wrapper = await mountSuspended(CalendarPage)
    const day15 = wrapper.find('[data-day="15"]')
    expect(day15.text()).toContain('Community Cookout')
    expect(wrapper.find('[data-day="14"]').text()).not.toContain('Community Cookout')
  })

  it('places events on the first and last day of the month correctly (TC-3.1-03)', async () => {
    const firstDay: Event = { ...EVENT_MID_MONTH, id: 'event-first', name: 'First Day Event', dateTime: '2026-09-01T09:00:00.000Z' }
    const lastDay: Event = { ...EVENT_MID_MONTH, id: 'event-last', name: 'Last Day Event', dateTime: '2026-09-30T21:00:00.000Z' }
    mockEvents = ref([firstDay, lastDay])
    const wrapper = await mountSuspended(CalendarPage)
    expect(wrapper.find('[data-day="1"]').text()).toContain('First Day Event')
    expect(wrapper.find('[data-day="30"]').text()).toContain('Last Day Event')
  })

  it('navigates to the next month (TC-3.1-04)', async () => {
    mockEvents = ref([])
    const wrapper = await mountSuspended(CalendarPage)
    await wrapper.find('[data-action="next-month"]').trigger('click')
    expect(wrapper.text()).toContain('October 2026')
    expect(wrapper.findAll('[data-day]')).toHaveLength(31)
  })

  it('re-buckets events correctly after navigating to the next month (TC-3.1-04)', async () => {
    const octoberEvent: Event = { ...EVENT_MID_MONTH, id: 'event-oct', name: 'October Idea', dateTime: '2026-10-03T09:00:00.000Z' }
    mockEvents = ref([octoberEvent])
    const wrapper = await mountSuspended(CalendarPage)
    await wrapper.find('[data-action="next-month"]').trigger('click')
    expect(wrapper.find('[data-day="3"]').text()).toContain('October Idea')
  })

  it('navigates to the previous month (TC-3.1-05)', async () => {
    mockEvents = ref([])
    const wrapper = await mountSuspended(CalendarPage)
    await wrapper.find('[data-action="prev-month"]').trigger('click')
    expect(wrapper.text()).toContain('August 2026')
    expect(wrapper.findAll('[data-day]')).toHaveLength(31)
  })

  it('does not render a separate "today" panel (reverted — see 07-milestones.md)', async () => {
    mockEvents = ref([])
    const wrapper = await mountSuspended(CalendarPage)
    expect(wrapper.find('[data-section="today-events"]').exists()).toBe(false)
  })
})
