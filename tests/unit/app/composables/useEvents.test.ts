import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEvents } from '../../../../app/composables/useEvents'
import type { CreateEventInput, Event } from '../../../../shared/types'

const EVENT_A: Event = {
  id: 'event-1',
  name: 'Community Cookout',
  location: 'Base Pavilion',
  type: 'Social',
  description: 'A casual cookout.',
  dateTime: '2026-09-01T18:00:00.000Z',
  submittedBy: 'user-1',
  baseSupport: false,
  resourcesCommitted: false,
  createdAt: '2026-08-21T09:00:00.000Z'
}

const EVENT_B: Event = { ...EVENT_A, id: 'event-2', name: 'Trivia Night' }

// events is a Nuxt-app-scoped useState singleton, same reasoning as useAuth's beforeEach reset.
beforeEach(() => {
  useEvents().events.value = []
})

describe('useEvents', () => {
  it('starts with an empty events list', () => {
    const { events } = useEvents()
    expect(events.value).toEqual([])
  })

  it('refresh() fetches the event list and stores it', async () => {
    const fetchMock = vi.fn().mockResolvedValue([EVENT_A, EVENT_B])
    const { events, refresh } = useEvents()

    const result = await refresh(fetchMock as never)

    expect(fetchMock).toHaveBeenCalledWith('/api/events')
    expect(result).toEqual([EVENT_A, EVENT_B])
    expect(events.value).toEqual([EVENT_A, EVENT_B])
  })

  it('createEvent() posts the input and appends the created event to state', async () => {
    const input: CreateEventInput = {
      name: 'Trivia Night',
      location: 'Community Center',
      type: 'Social',
      description: 'Weekly trivia.',
      dateTime: '2026-09-05T19:00:00.000Z'
    }
    const fetchMock = vi.fn().mockResolvedValue(EVENT_B)
    const { events, createEvent } = useEvents()
    events.value = [EVENT_A]

    const created = await createEvent(input, fetchMock as never)

    expect(fetchMock).toHaveBeenCalledWith('/api/events', { method: 'POST', body: input })
    expect(created).toEqual(EVENT_B)
    expect(events.value).toEqual([EVENT_A, EVENT_B])
  })

  it('does not change state when createEvent fails', async () => {
    const failingFetch = vi.fn().mockRejectedValue(new Error('400 bad request'))
    const { events, createEvent } = useEvents()
    events.value = [EVENT_A]

    const badInput: CreateEventInput = {
      name: '',
      location: '',
      type: 'Social',
      description: '',
      dateTime: ''
    }

    await expect(createEvent(badInput, failingFetch as never)).rejects.toThrow()
    expect(events.value).toEqual([EVENT_A])
  })
})
