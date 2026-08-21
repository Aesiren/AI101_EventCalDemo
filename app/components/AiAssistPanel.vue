<template>
  <div class="ai-assist-panel flex flex-col gap-4">
    <ul v-if="conversation.length" class="ai-assist-panel__log flex flex-col gap-2">
      <li
        v-for="(turn, i) in conversation"
        :key="i"
        :class="[`ai-assist-panel__turn--${turn.role}`, 'rounded-md p-3 text-sm', turn.role === 'user' ? 'bg-elevated self-end' : 'bg-primary/10']"
      >
        {{ turn.content }}
      </li>
    </ul>

    <UCard v-if="hasAnyProposedField" variant="subtle" class="ai-assist-panel__fields-preview">
      <h3 class="font-semibold mb-2">What we have so far</h3>
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <template v-for="field in FIELD_ORDER" :key="field">
          <template v-if="latestResult?.proposedFields[field]">
            <dt class="text-muted">{{ FIELD_LABELS[field] }}</dt>
            <dd>{{ latestResult.proposedFields[field] }}</dd>
          </template>
        </template>
      </dl>
    </UCard>

    <template v-if="isRejected">
      <UAlert role="alert" class="ai-assist-panel__rejected" color="error" variant="soft" :title="rejectionMessage" />
      <UButton type="button" data-action="start-over" color="neutral" variant="soft" @click="handleReset">Start Over</UButton>
    </template>

    <template v-else>
      <UAlert v-if="latestResult && !latestResult.readyToSubmit" class="ai-assist-panel__question" color="warning" variant="soft" :title="latestResult.followUpQuestion" />
      <UAlert v-if="error" role="alert" color="error" variant="soft" :title="error" />

      <form class="flex flex-col gap-2" @submit.prevent="handleSend">
        <label class="flex flex-col gap-1.5 text-sm font-medium">
          {{ conversation.length ? 'Your response' : 'Describe your event idea' }}
          <UTextarea v-model="userInput" name="userInput" :disabled="loading" />
        </label>
        <UButton type="submit" :disabled="loading || !userInput.trim()">Send</UButton>
      </form>

      <UButton
        v-if="latestResult?.readyToSubmit"
        type="button"
        data-action="submit-event"
        color="success"
        :disabled="submitting"
        @click="handleSubmit"
      >
        Submit Event
      </UButton>
    </template>
  </div>
</template>

<script setup lang="ts">
// AI-assisted event submission UI (US-1.5–US-1.9). Free-text entry, follow-up prompts, a proposed
// fields preview, correction messaging, and submit/reject actions. Every message shown here is
// either the agent's followUpQuestion (already just a template or guidelines.ts's own message —
// see agent.ts's design notes) or text this component wrote itself; nothing is rendered from raw
// model text.
// Restyled with Nuxt UI (Milestone 5): UCard/UAlert/UButton/UTextarea replace the old bare
// elements; UTextarea still renders a real native <textarea name="userInput">, so existing
// [name="userInput"] queries and .setValue() keep working unchanged.
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
