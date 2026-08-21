import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EventCard from '../../../../app/components/EventCard.vue'
import type { Event } from '../../../../shared/types'

const BASE_EVENT: Event = {
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

describe('EventCard', () => {
  it('renders all six fields (US-1.2, TC-1.2-01)', async () => {
    const wrapper = await mountSuspended(EventCard, { props: { event: BASE_EVENT } })
    const text = wrapper.text()
    expect(text).toContain('Community Cookout')
    expect(text).toContain('Base Pavilion')
    expect(text).toContain('Social')
    expect(text).toContain('A casual cookout open to all base members.')
    expect(text).toContain('2026-09-01T18:00:00.000Z')
    expect(text).toMatch(/base support/i)
  })

  it('labels Base support as granted, distinctly, when true (TC-1.2-02/03)', async () => {
    const wrapper = await mountSuspended(EventCard, {
      props: { event: { ...BASE_EVENT, baseSupport: true } }
    })
    expect(wrapper.find('[data-base-support="true"]').exists()).toBe(true)
    expect(wrapper.find('[data-base-support="false"]').exists()).toBe(false)
  })

  it('labels Base support as not granted, distinctly, when false (TC-1.2-02/03)', async () => {
    const wrapper = await mountSuspended(EventCard, {
      props: { event: { ...BASE_EVENT, baseSupport: false } }
    })
    expect(wrapper.find('[data-base-support="false"]').exists()).toBe(true)
    expect(wrapper.find('[data-base-support="true"]').exists()).toBe(false)
  })

  it('renders different, explicit text for the two states — not just presence/absence of a label (TC-1.2-03)', async () => {
    const supported = await mountSuspended(EventCard, {
      props: { event: { ...BASE_EVENT, baseSupport: true } }
    })
    const unsupported = await mountSuspended(EventCard, {
      props: { event: { ...BASE_EVENT, baseSupport: false } }
    })
    const supportedText = supported.find('[data-base-support]').text()
    const unsupportedText = unsupported.find('[data-base-support]').text()
    expect(supportedText).not.toBe('')
    expect(unsupportedText).not.toBe('')
    expect(supportedText).not.toBe(unsupportedText)
  })
})
