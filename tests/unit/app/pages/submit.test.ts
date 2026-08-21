import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SubmitPage from '../../../../app/pages/submit.vue'
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

describe('submit page', () => {
  it('hosts EventForm', async () => {
    const wrapper = await mountSuspended(SubmitPage)
    expect(wrapper.findComponent(EventForm).exists()).toBe(true)
  })

  it('shows a confirmation message after EventForm emits "submitted"', async () => {
    const wrapper = await mountSuspended(SubmitPage)
    await wrapper.findComponent(EventForm).vm.$emit('submitted', CREATED)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toMatch(/submitted/i)
  })
})
