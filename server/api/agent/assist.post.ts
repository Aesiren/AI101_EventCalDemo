// AI-assisted event submission (US-1.5–US-1.9, FR-3, FR-4). Thin route: auth check, construct
// the real Anthropic client, delegate to assist() (server/utils/agent.ts) for everything else.
//
// The Anthropic() constructor is called here, inside the handler — not at module load time —
// because Nitro eagerly loads every server/api/* file to build its route table at startup, and
// we don't want a missing/bad API key to be able to affect anything beyond this one route.
//
// Note: new Anthropic() does NOT throw when no API key is configured — it only fails later, when
// an actual request is attempted (inside assist()'s client.messages.create() call). Confirmed
// live: an earlier version of this route wrapped only the constructor in try/catch, assuming it
// would throw eagerly, and a real dev-server request proved that wrong — the missing-key error
// came back as a raw, unhandled SDK stack trace instead of the clean message intended. Fixed by
// checking for the key explicitly up front, and wrapping the actual API call too, so any other
// failure (bad key, rate limit, an Anthropic outage) also fails cleanly rather than leaking
// internal details to the client.

import Anthropic from '@anthropic-ai/sdk'
import type { AssistRequest } from '../../../shared/types'
import { assist } from '../../utils/agent'
import { store } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const accountId = getCookie(event, 'accountId')
  if (!accountId || !store.listAccounts().some(a => a.id === accountId)) {
    throw createError({ statusCode: 401, statusMessage: 'You must be logged in to use the AI assistant' })
  }

  const body = await readBody<Partial<AssistRequest>>(event)
  if (typeof body?.userInput !== 'string' || !body.userInput.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'userInput is required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw createError({
      statusCode: 500,
      statusMessage: 'AI assistant is not configured (missing ANTHROPIC_API_KEY)'
    })
  }

  const client = new Anthropic()
  const conversation = body.conversation ?? []

  try {
    return await assist(conversation, body.userInput, client)
  } catch (error) {
    console.error('[agent/assist] Anthropic API call failed:', error)
    throw createError({ statusCode: 502, statusMessage: 'AI assistant is temporarily unavailable' })
  }
})
