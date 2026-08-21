import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AiAssistPanel from '../../../../app/components/AiAssistPanel.vue'
import type { AgentTurnResult, Event } from '../../../../shared/types'

const MISSING_FIELDS_RESULT: AgentTurnResult = {
  readyToSubmit: false,
  proposedFields: { name: 'Community Cookout' },
  missingFields: ['location', 'type', 'description', 'dateTime'],
  guidelineResult: { status: 'clear' },
  followUpQuestion: "Could you tell me the event's location, category, description and date and time?"
}

const CORRECTABLE_RESULT: AgentTurnResult = {
  readyToSubmit: false,
  proposedFields: { name: 'Wine Tasting', description: 'A wine tasting with a full bar.' },
  missingFields: ['location', 'type', 'dateTime'],
  guidelineResult: { status: 'correctable', guideline: 'No alcohol-specific events', message: 'This event appears to be centered on alcohol. Please revise so alcohol is not the focus.' },
  followUpQuestion: 'This event appears to be centered on alcohol. Please revise so alcohol is not the focus.'
}

const REJECTED_RESULT: AgentTurnResult = {
  readyToSubmit: false,
  proposedFields: { name: 'Youth Mixer', description: 'A teen night with a full bar.' },
  missingFields: ['location', 'type', 'dateTime'],
  guidelineResult: { status: 'rejected', guideline: 'No alcohol at events tailored for under-21 members', message: 'This event mentions alcohol and appears tailored for members under 21. This cannot be corrected within this submission.' },
  followUpQuestion: 'This event mentions alcohol and appears tailored for members under 21. This cannot be corrected within this submission.'
}

const READY_RESULT: AgentTurnResult = {
  readyToSubmit: true,
  proposedFields: {
    name: 'Community Cookout',
    location: 'Base Pavilion',
    type: 'Social',
    description: 'A casual cookout open to all base members.',
    dateTime: '2026-09-01T18:00:00.000Z'
  },
  missingFields: [],
  guidelineResult: { status: 'clear' }
}

const CREATED: Event = {
  id: 'event-1',
  ...READY_RESULT.proposedFields,
  submittedBy: 'user-1',
  baseSupport: false,
  resourcesCommitted: false,
  createdAt: '2026-08-21T09:00:00.000Z'
}

const assistMock = vi.fn()
const createEventMock = vi.fn()

// Explicit imports in the component (not Nuxt auto-imports) make these plain, reliable vi.mocks —
// same reasoning as EventForm's useEvents mock.
vi.mock('../../../../app/composables/useAgent', () => ({
  useAgent: () => ({ assist: assistMock })
}))
vi.mock('../../../../app/composables/useEvents', () => ({
  useEvents: () => ({
    events: { value: [] },
    refresh: vi.fn(),
    createEvent: createEventMock,
    fetchEvent: vi.fn(),
    setBaseSupport: vi.fn()
  })
}))

describe('AiAssistPanel', () => {
  it('renders a free-text entry initially', async () => {
    const wrapper = await mountSuspended(AiAssistPanel)
    expect(wrapper.find('[name="userInput"]').exists()).toBe(true)
  })

  it('sends the first message and shows the follow-up question and proposed fields (TC-1.5-01/02, TC-1.6-01/03)', async () => {
    assistMock.mockClear().mockResolvedValue(MISSING_FIELDS_RESULT)
    const wrapper = await mountSuspended(AiAssistPanel)

    await wrapper.find('[name="userInput"]').setValue('lets do a cookout')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(assistMock).toHaveBeenCalledWith([], 'lets do a cookout')
    expect(wrapper.text()).toContain('Community Cookout') // proposed field shown
    expect(wrapper.text()).toMatch(/location, category, description and date and time/i)
    expect(wrapper.find('button[data-action="submit-event"]').exists()).toBe(false) // not ready yet — no submit button
  })

  it('sends a follow-up turn with the growing conversation history (TC-1.6-02)', async () => {
    assistMock.mockClear()
    assistMock.mockResolvedValueOnce(MISSING_FIELDS_RESULT)
    const wrapper = await mountSuspended(AiAssistPanel)

    await wrapper.find('[name="userInput"]').setValue('lets do a cookout')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    assistMock.mockResolvedValueOnce(READY_RESULT)
    await wrapper.find('[name="userInput"]').setValue('Base Pavilion, Sept 1 6pm, Social')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(assistMock).toHaveBeenLastCalledWith(
      [
        { role: 'user', content: 'lets do a cookout' },
        { role: 'assistant', content: MISSING_FIELDS_RESULT.followUpQuestion }
      ],
      'Base Pavilion, Sept 1 6pm, Social'
    )
  })

  it('shows a correction message and no submit button for a correctable guideline conflict (TC-1.7-05)', async () => {
    assistMock.mockClear().mockResolvedValue(CORRECTABLE_RESULT)
    const wrapper = await mountSuspended(AiAssistPanel)

    await wrapper.find('[name="userInput"]').setValue('wine tasting with a full bar')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toMatch(/alcohol/i)
    expect(wrapper.find('button[data-action="submit-event"]').exists()).toBe(false)
    // Still correctable — the free-text form stays available so the user can revise.
    expect(wrapper.find('[name="userInput"]').exists()).toBe(true)
  })

  it('shows a rejection message, hides the form, and offers no submit option (TC-1.9-03)', async () => {
    assistMock.mockClear().mockResolvedValue(REJECTED_RESULT)
    const wrapper = await mountSuspended(AiAssistPanel)

    await wrapper.find('[name="userInput"]').setValue('teen night with a full bar')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toMatch(/cannot be corrected/i)
    expect(wrapper.find('button[data-action="submit-event"]').exists()).toBe(false)
    expect(wrapper.find('[name="userInput"]').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/start over/i)
  })

  it('"Start Over" resets the conversation after a rejection', async () => {
    assistMock.mockClear().mockResolvedValue(REJECTED_RESULT)
    const wrapper = await mountSuspended(AiAssistPanel)
    await wrapper.find('[name="userInput"]').setValue('teen night with a full bar')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    await wrapper.find('button[data-action="start-over"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[name="userInput"]').exists()).toBe(true)
    expect(wrapper.text()).not.toMatch(/cannot be corrected/i)
  })

  it('offers submit once ready, and creating the event emits "submitted" (TC-1.8-01/02)', async () => {
    assistMock.mockClear().mockResolvedValue(READY_RESULT)
    createEventMock.mockClear().mockResolvedValue(CREATED)
    const wrapper = await mountSuspended(AiAssistPanel)

    await wrapper.find('[name="userInput"]').setValue('a complete description')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[data-action="submit-event"]').exists()).toBe(true)
    await wrapper.find('button[data-action="submit-event"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(createEventMock).toHaveBeenCalledWith(READY_RESULT.proposedFields)
    expect(wrapper.emitted('submitted')?.[0]).toEqual([CREATED])
  })

  it('shows an error and does not crash when assist() fails', async () => {
    assistMock.mockClear().mockRejectedValue(new Error('network error'))
    const wrapper = await mountSuspended(AiAssistPanel)

    await wrapper.find('[name="userInput"]').setValue('lets do a cookout')
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toMatch(/went wrong/i)
  })
})
