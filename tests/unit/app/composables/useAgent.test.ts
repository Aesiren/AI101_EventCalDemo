import { describe, expect, it, vi } from 'vitest'
import { useAgent } from '../../../../app/composables/useAgent'
import type { AgentTurnResult } from '../../../../shared/types'

const RESULT: AgentTurnResult = {
  proposedFields: { name: 'Community Cookout' },
  missingFields: ['location', 'type', 'description', 'dateTime'],
  guidelineResult: { status: 'clear' },
  followUpQuestion: "Could you tell me the event's location, category, description and date and time?",
  readyToSubmit: false
}

describe('useAgent', () => {
  it('assist() posts the conversation and userInput to /api/agent/assist', async () => {
    const fetchMock = vi.fn().mockResolvedValue(RESULT)
    const { assist } = useAgent()

    const result = await assist([], 'lets do a cookout', fetchMock as never)

    expect(fetchMock).toHaveBeenCalledWith('/api/agent/assist', {
      method: 'POST',
      body: { conversation: [], userInput: 'lets do a cookout' }
    })
    expect(result).toEqual(RESULT)
  })

  it('passes an existing conversation history through unchanged', async () => {
    const fetchMock = vi.fn().mockResolvedValue(RESULT)
    const { assist } = useAgent()
    const history = [
      { role: 'user' as const, content: 'lets do a cookout' },
      { role: 'assistant' as const, content: "Could you tell me the event's location?" }
    ]

    await assist(history, 'Base Pavilion', fetchMock as never)

    expect(fetchMock).toHaveBeenCalledWith('/api/agent/assist', {
      method: 'POST',
      body: { conversation: history, userInput: 'Base Pavilion' }
    })
  })
})
