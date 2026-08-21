// Wraps POST /api/agent/assist for the UI layer (US-1.5–US-1.9). Same injectable-fetcher pattern
// as useAuth/useEvents — tests pass a mock fetcher directly rather than fighting Nuxt's $fetch
// auto-import mocking.

import type { AgentTurnResult, AssistRequest } from '../../shared/types'

export function useAgent() {
  async function assist(
    conversation: AssistRequest['conversation'],
    userInput: string,
    fetcher: typeof $fetch = $fetch
  ): Promise<AgentTurnResult> {
    return fetcher<AgentTurnResult>('/api/agent/assist', {
      method: 'POST',
      body: { conversation, userInput } satisfies AssistRequest
    })
  }

  return { assist }
}
