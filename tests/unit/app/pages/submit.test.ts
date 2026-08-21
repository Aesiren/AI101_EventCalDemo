import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SubmitPage from '../../../../app/pages/submit.vue'
import EventForm from '../../../../app/components/EventForm.vue'
import AiAssistPanel from '../../../../app/components/AiAssistPanel.vue'
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
  it('defaults to the AI Assistant tab', async () => {
    const wrapper = await mountSuspended(SubmitPage)
    expect(wrapper.findComponent(AiAssistPanel).exists()).toBe(true)
    expect(wrapper.findComponent(EventForm).exists()).toBe(false)
  })

  it('switches to Manual Entry when that tab is clicked, unmounting the assist panel', async () => {
    const wrapper = await mountSuspended(SubmitPage)
    await wrapper.find('button[data-tab="manual"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(EventForm).exists()).toBe(true)
    expect(wrapper.findComponent(AiAssistPanel).exists()).toBe(false)
  })

  it('switches back to the AI Assistant tab', async () => {
    const wrapper = await mountSuspended(SubmitPage)
    await wrapper.find('button[data-tab="manual"]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.find('button[data-tab="assist"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(AiAssistPanel).exists()).toBe(true)
    expect(wrapper.findComponent(EventForm).exists()).toBe(false)
  })

  it('shows a confirmation message after EventForm emits "submitted"', async () => {
    const wrapper = await mountSuspended(SubmitPage)
    await wrapper.find('button[data-tab="manual"]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.findComponent(EventForm).vm.$emit('submitted', CREATED)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toMatch(/submitted/i)
  })

  it('shows a confirmation message after AiAssistPanel emits "submitted"', async () => {
    const wrapper = await mountSuspended(SubmitPage)
    await wrapper.findComponent(AiAssistPanel).vm.$emit('submitted', CREATED)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toMatch(/submitted/i)
  })
})
