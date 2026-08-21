import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
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

// Mocking navigateTo rather than letting the real logged-out redirect run — see the note in
// tests/unit/app/layouts/default.test.ts for why (an occasional "history is not defined"
// unhandled rejection under happy-dom).
const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

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

  it('shows a dashboard entry for every Milestone 6 view (US-3.4, calendar/votes/needs-voting)', async () => {
    mockCurrentAccount = ref(USER)
    mockIsLeader = ref(false)
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('a[href="/calendar"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/votes"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/needs-voting"]').exists()).toBe(true)
  })

  it('also shows a Leader Review link for a logged-in Leader', async () => {
    mockCurrentAccount = ref(LEADER)
    mockIsLeader = ref(true)
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('a[href="/leader"]').exists()).toBe(true)
  })

  it('redirects a logged-out visitor to /login', async () => {
    mockCurrentAccount = ref(null)
    mockIsLeader = ref(false)
    navigateToMock.mockClear()
    await mountSuspended(IndexPage)
    expect(navigateToMock).toHaveBeenCalledWith('/login')
  })
})
