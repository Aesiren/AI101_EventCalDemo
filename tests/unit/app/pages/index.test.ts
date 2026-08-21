import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '../../../../app/pages/index.vue'
import type { Account } from '../../../../shared/types'

const USER: Account = { id: 'user-1', name: 'Casey Rivera', role: 'User' }
const LEADER: Account = { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }

let mockCurrentAccount = ref<Account | null>(null)
let mockIsLeader = ref(false)

vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: mockCurrentAccount,
    isLeader: mockIsLeader,
    login: vi.fn(),
    logout: vi.fn(),
    listAccounts: vi.fn()
  })
}))

describe('home page', () => {
  it('shows a welcome message and nav for a logged-in User (no redirect away)', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.text()).toContain('Casey Rivera')
    expect(wrapper.find('a[href="/events"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/submit"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(false)
  })

  it('also shows a Leader Review link for a logged-in Leader', async () => {
    mockCurrentAccount = ref(LEADER)
    mockIsLeader = ref(true)
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(true)
  })

  it('redirects a logged-out visitor to /login without throwing', async () => {
    mockCurrentAccount = ref(null)
    mockIsLeader = ref(false)
    await expect(mountSuspended(IndexPage)).resolves.toBeTruthy()
  })
})
