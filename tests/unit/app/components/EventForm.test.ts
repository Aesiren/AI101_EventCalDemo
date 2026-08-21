import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EventForm from '../../../../app/components/EventForm.vue'
import type { Event } from '../../../../shared/types'

const CREATED: Event = {
  id: 'event-1',
  name: 'Community Cookout',
  location: 'Base Pavilion',
  type: 'Social',
  description: 'A casual cookout open to all base members.',
  dateTime: '2026-09-01T18:00',
  submittedBy: 'user-1',
  baseSupport: false,
  resourcesCommitted: false,
  createdAt: '2026-08-21T09:00:00.000Z'
}

const createEventMock = vi.fn().mockResolvedValue(CREATED)

// Explicit import in the component (not Nuxt auto-import) is exactly what makes this a plain,
// reliable vi.mock rather than something fighting Nuxt's $fetch auto-import resolution.
vi.mock('../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: { value: [] },
    refresh: vi.fn(),
    createEvent: createEventMock
  })
}))

describe('EventForm', () => {
  it('renders a field for every required input', async () => {
    const wrapper = await mountSuspended(EventForm)
    expect(wrapper.find('[name="name"]').exists()).toBe(true)
    expect(wrapper.find('[name="location"]').exists()).toBe(true)
    expect(wrapper.find('[name="type"]').exists()).toBe(true)
    expect(wrapper.find('[name="description"]').exists()).toBe(true)
    expect(wrapper.find('[name="dateTime"]').exists()).toBe(true)
  })

  it('blocks submission and shows errors when required fields are empty (US-1.4, TC-1.4-01..06)', async () => {
    createEventMock.mockClear()
    const wrapper = await mountSuspended(EventForm)

    await wrapper.find('form').trigger('submit.prevent')

    expect(createEventMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toMatch(/required/i)
  })

  it('submits valid input and emits "submitted" with the created event (US-1.3, TC-1.4-05)', async () => {
    createEventMock.mockClear()
    const wrapper = await mountSuspended(EventForm)

    await wrapper.find('[name="name"]').setValue('Community Cookout')
    await wrapper.find('[name="location"]').setValue('Base Pavilion')
    await wrapper.find('[name="type"]').setValue('Social')
    await wrapper.find('[name="description"]').setValue('A casual cookout open to all base members.')
    await wrapper.find('[name="dateTime"]').setValue('2026-09-01T18:00')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(createEventMock).toHaveBeenCalledWith({
      name: 'Community Cookout',
      location: 'Base Pavilion',
      type: 'Social',
      description: 'A casual cookout open to all base members.',
      dateTime: '2026-09-01T18:00'
    })
    expect(wrapper.emitted('submitted')?.[0]).toEqual([CREATED])
  })

  it('shows an error and does not emit "submitted" when createEvent fails (e.g. not logged in)', async () => {
    createEventMock.mockClear()
    createEventMock.mockRejectedValueOnce(new Error('401 not logged in'))
    const wrapper = await mountSuspended(EventForm)

    await wrapper.find('[name="name"]').setValue('Community Cookout')
    await wrapper.find('[name="location"]').setValue('Base Pavilion')
    await wrapper.find('[name="type"]').setValue('Social')
    await wrapper.find('[name="description"]').setValue('A casual cookout open to all base members.')
    await wrapper.find('[name="dateTime"]').setValue('2026-09-01T18:00')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('submitted')).toBeUndefined()
    expect(wrapper.text()).toMatch(/submission failed/i)
  })

  it('clears the form after a successful submission', async () => {
    createEventMock.mockClear()
    const wrapper = await mountSuspended(EventForm)

    await wrapper.find('[name="name"]').setValue('Community Cookout')
    await wrapper.find('[name="location"]').setValue('Base Pavilion')
    await wrapper.find('[name="type"]').setValue('Social')
    await wrapper.find('[name="description"]').setValue('A casual cookout open to all base members.')
    await wrapper.find('[name="dateTime"]').setValue('2026-09-01T18:00')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect((wrapper.find('[name="name"]').element as HTMLInputElement).value).toBe('')
  })
})
