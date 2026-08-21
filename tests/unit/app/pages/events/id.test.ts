import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EventDetailPage from '../../../../../app/pages/events/[id].vue'
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

const fetchEventMock = vi.fn()

vi.mock('../../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: { value: [] },
    refresh: vi.fn(),
    createEvent: vi.fn(),
    fetchEvent: fetchEventMock
  })
}))

describe('event detail page', () => {
  it('fetches and renders the event matching the route id', async () => {
    fetchEventMock.mockResolvedValue(EVENT_A)
    const wrapper = await mountSuspended(EventDetailPage, { route: '/events/event-1' })

    expect(fetchEventMock).toHaveBeenCalledWith('event-1')
    expect(wrapper.text()).toContain('Community Cookout')
  })

  it('shows a not-found message when the event does not exist', async () => {
    fetchEventMock.mockRejectedValue(new Error('404 not found'))
    const wrapper = await mountSuspended(EventDetailPage, { route: '/events/nope' })

    expect(wrapper.text()).toMatch(/not found/i)
  })
})
