import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ResourcesCommittedToggle from '../../../../app/components/ResourcesCommittedToggle.vue'
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

// Must be real Vue refs, not plain { value } objects — see BaseSupportToggle.test.ts for why a
// plain object silently breaks v-if.
let mockIsLeader = ref(false)
const setResourcesCommittedMock = vi.fn().mockResolvedValue({ ...EVENT_A, resourcesCommitted: true })

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
    setBaseSupport: vi.fn(),
    setResourcesCommitted: setResourcesCommittedMock,
    fetchInterest: vi.fn(),
    castInterest: vi.fn()
  })
}))

describe('ResourcesCommittedToggle', () => {
  it('renders no control at all for a User-role account (US-2.6)', async () => {
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(ResourcesCommittedToggle, { props: { event: EVENT_A } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders a toggle for a Leader-role account', async () => {
    mockIsLeader = ref(true)
    const wrapper = await mountSuspended(ResourcesCommittedToggle, { props: { event: EVENT_A } })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('calls setResourcesCommitted with the flipped value on click', async () => {
    mockIsLeader = ref(true)
    setResourcesCommittedMock.mockClear()
    const wrapper = await mountSuspended(ResourcesCommittedToggle, { props: { event: EVENT_A } })

    await wrapper.find('button').trigger('click')

    expect(setResourcesCommittedMock).toHaveBeenCalledWith('event-1', true)
  })
})
