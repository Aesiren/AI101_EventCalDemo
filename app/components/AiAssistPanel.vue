<template>
  <div class="ai-assist-panel">
    <ul v-if="conversation.length" class="ai-assist-panel__log">
      <li v-for="(turn, i) in conversation" :key="i" :class="`ai-assist-panel__turn--${turn.role}`">
        {{ turn.content }}
      </li>
    </ul>

    <div v-if="hasAnyProposedField" class="ai-assist-panel__fields-preview">
      <h3>What we have so far</h3>
      <dl>
        <template v-for="field in FIELD_ORDER" :key="field">
          <template v-if="latestResult?.proposedFields[field]">
            <dt>{{ FIELD_LABELS[field] }}</dt>
            <dd>{{ latestResult.proposedFields[field] }}</dd>
          </template>
        </template>
      </dl>
    </div>

    <template v-if="isRejected">
      <p role="alert" class="ai-assist-panel__rejected">{{ rejectionMessage }}</p>
      <button type="button" data-action="start-over" @click="handleReset">Start Over</button>
    </template>

    <template v-else>
      <p v-if="latestResult && !latestResult.readyToSubmit" class="ai-assist-panel__question">
        {{ latestResult.followUpQuestion }}
      </p>
      <p v-if="error" role="alert">{{ error }}</p>

      <form @submit.prevent="handleSend">
        <label>
          {{ conversation.length ? 'Your response' : 'Describe your event idea' }}
          <textarea v-model="userInput" name="userInput" :disabled="loading" />
        </label>
        <button type="submit" :disabled="loading || !userInput.trim()">Send</button>
      </form>

      <button
        v-if="latestResult?.readyToSubmit"
        type="button"
        data-action="submit-event"
        :disabled="submitting"
        @click="handleSubmit"
      >
        Submit Event
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
// AI-assisted event submission UI (US-1.5–US-1.9). Free-text entry, follow-up prompts, a proposed
// fields preview, correction messaging, and submit/reject actions. Every message shown here is
// either the agent's followUpQuestion (already just a template or guidelines.ts's own message —
// see agent.ts's design notes) or text this component wrote itself; nothing is rendered from raw
// model text.
import type { AgentTurnResult, CreateEventInput, Event } from '../../shared/types'
import { useAgent } from '../composables/useAgent'
import { useEvents } from '../composables/useEvents'

const emit = defineEmits<{ submitted: [event: Event] }>()

const FIELD_ORDER: (keyof CreateEventInput)[] = ['name', 'location', 'type', 'description', 'dateTime']
const FIELD_LABELS: Record<keyof CreateEventInput, string> = {
  name: 'Name',
  location: 'Location',
  type: 'Type',
  description: 'Description',
  dateTime: 'Date/Time'
}

const conversation = ref<{ role: 'user' | 'assistant'; content: string }[]>([])
const userInput = ref('')
const latestResult = ref<AgentTurnResult | null>(null)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')

const { assist } = useAgent()
const { createEvent } = useEvents()

const isRejected = computed(
  () => !!latestResult.value && !latestResult.value.readyToSubmit && latestResult.value.guidelineResult.status === 'rejected'
)
const rejectionMessage = computed(() =>
  latestResult.value && !latestResult.value.readyToSubmit && latestResult.value.guidelineResult.status === 'rejected'
    ? latestResult.value.guidelineResult.message
    : ''
)
const hasAnyProposedField = computed(
  () => !!latestResult.value && Object.keys(latestResult.value.proposedFields).length > 0
)

async function handleSend() {
  const input = userInput.value.trim()
  if (!input) return

  error.value = ''
  loading.value = true
  try {
    const history = conversation.value
    const result = await assist(history, input)
    conversation.value = [
      ...history,
      { role: 'user', content: input },
      { role: 'assistant', content: result.readyToSubmit ? '(fields ready to submit)' : result.followUpQuestion }
    ]
    latestResult.value = result
    userInput.value = ''
  } catch {
    error.value = 'Something went wrong talking to the AI assistant. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!latestResult.value?.readyToSubmit) return
  submitting.value = true
  error.value = ''
  try {
    // readyToSubmit narrows proposedFields to a complete CreateEventInput — no cast needed.
    const created = await createEvent(latestResult.value.proposedFields)
    emit('submitted', created)
    handleReset()
  } catch {
    error.value = 'Submission failed. Please make sure you are logged in and try again.'
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  conversation.value = []
  latestResult.value = null
  userInput.value = ''
  error.value = ''
}
</script>
