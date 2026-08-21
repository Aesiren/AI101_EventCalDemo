import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseSupportToggle from '../../../../app/components/BaseSupportToggle.vue'
import type { Event } from '../../../../shared/types'

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

// Must be real Vue refs, not plain { value } objects — Vue's template auto-unwrapping (what
// makes `v-if="isLeader"` mean `v-if="isLeader.value"`) only applies to actual refs (checked via
// isRef()). A plain object is always truthy regardless of what's inside it, which silently
// breaks the v-if. Reassigned per test since useState-style singletons aren't in play here.
let mockIsLeader = ref(false)
const setBaseSupportMock = vi.fn().mockResolvedValue({ ...EVENT_A, baseSupport: true })

vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: ref(null),
    isLeader: mockIsLeader,
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
    setBaseSupport: setBaseSupportMock
  })
}))

describe('BaseSupportToggle', () => {
  it('renders no control at all for a User-role account (US-1.12, TC-1.12-03)', async () => {
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(BaseSupportToggle, { props: { event: EVENT_A } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders a toggle for a Leader-role account', async () => {
    mockIsLeader = ref(true)
    const wrapper = await mountSuspended(BaseSupportToggle, { props: { event: EVENT_A } })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('calls setBaseSupport with the flipped value on click', async () => {
    mockIsLeader = ref(true)
    setBaseSupportMock.mockClear()
    const wrapper = await mountSuspended(BaseSupportToggle, { props: { event: EVENT_A } })

    await wrapper.find('button').trigger('click')

    expect(setBaseSupportMock).toHaveBeenCalledWith('event-1', true)
  })
})
