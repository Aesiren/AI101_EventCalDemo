import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DefaultLayout from '../../../../app/layouts/default.vue'
import type { Account } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

let mockCurrentAccount = ref<Account | null>(null)
let mockIsLeader = ref(false)
const logoutMock = vi.fn()

vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: mockCurrentAccount,
    isLeader: mockIsLeader,
    login: vi.fn(),
    logout: logoutMock,
    listAccounts: vi.fn()
  })
}))

describe('default layout', () => {
  it('shows the dashboard title', async () => {
    mockCurrentAccount = ref(null)
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.text()).toContain('Unit Morale Improvement Dashboard')
  })

  it('shows a Log In link and hides authenticated-only nav when logged out', async () => {
    mockCurrentAccount = ref(null)
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/submit"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows Submit Event, account name, and a Log Out button for a logged-in User', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.find('a[href="/submit"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Casey Rivera')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('also shows Leader Review for a logged-in Leader', async () => {
    mockCurrentAccount = ref(LEADER)
    mockIsLeader = ref(true)
    const wrapper = await mountSuspended(DefaultLayout)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(true)
  })

  it('logging out calls useAuth().logout()', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    logoutMock.mockClear()
    const wrapper = await mountSuspended(DefaultLayout)
    await wrapper.find('button').trigger('click')
    expect(logoutMock).toHaveBeenCalled()
  })
})
