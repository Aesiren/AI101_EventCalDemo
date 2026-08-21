import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoginPage from '../../../../app/pages/login.vue'
import type { Account } from '../../../../shared/types'

const ACCOUNTS: Account[] = [
  { id: 'user-1', name: 'Casey Rivera', role: 'User' },
  { id: 'user-2', name: 'Jordan Blake', role: 'User' },
  { id: 'leader-1', name: 'Morgan Hayes', role: 'Leader' }
]

const listAccountsMock = vi.fn().mockResolvedValue(ACCOUNTS)
const loginMock = vi.fn().mockResolvedValue(ACCOUNTS[0])

// Explicit import in the page (not Nuxt auto-import) makes this a plain vi.mock — same reasoning
// as EventForm/index.vue's useEvents mocking.
vi.mock('../../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    currentAccount: { value: null },
    isLeader: { value: false },
    listAccounts: listAccountsMock,
    login: loginMock,
    logout: vi.fn()
  })
}))

describe('login page', () => {
  it('offers every seeded account as a dropdown option — no free-text name entry', async () => {
    const wrapper = await mountSuspended(LoginPage)
    const options = wrapper.findAll('option[value]:not([value=""])')
    expect(options).toHaveLength(3)
    expect(wrapper.text()).toContain('Casey Rivera')
    expect(wrapper.text()).toContain('Jordan Blake')
    expect(wrapper.text()).toContain('Morgan Hayes')
    expect(wrapper.find('input[type=text]').exists()).toBe(false)
  })

  it('disables submit until an account is selected', async () => {
    const wrapper = await mountSuspended(LoginPage)
    expect((wrapper.find('button[type=submit]').element as HTMLButtonElement).disabled).toBe(true)
    await wrapper.find('select').setValue('Casey Rivera')
    expect((wrapper.find('button[type=submit]').element as HTMLButtonElement).disabled).toBe(false)
  })

  it('logs in with the exact selected account name on submit (US-1.13)', async () => {
    loginMock.mockClear()
    const wrapper = await mountSuspended(LoginPage)
    await wrapper.find('select').setValue('Morgan Hayes')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    expect(loginMock).toHaveBeenCalledWith('Morgan Hayes')
  })
})
