<template>
  <main>
    <h1>Submit an Event</h1>

    <div class="submit-page__tabs" role="tablist">
      <button type="button" data-tab="assist" :aria-pressed="mode === 'assist'" @click="mode = 'assist'">
        AI Assistant
      </button>
      <button type="button" data-tab="manual" :aria-pressed="mode === 'manual'" @click="mode = 'manual'">
        Manual Entry
      </button>
    </div>

    <AiAssistPanel v-if="mode === 'assist'" @submitted="handleSubmitted" />
    <EventForm v-else @submitted="handleSubmitted" />

    <p v-if="justSubmitted" role="status">Event submitted — thank you!</p>
  </main>
</template>

<script setup lang="ts">
// Hosts both submission paths (US-1.3–US-1.9) as a tab toggle. Defaults to the AI Assistant —
// it's the actual point of this demo — with Manual Entry one click away. AiAssistPanel and
// EventForm both emit the same 'submitted' event with the created Event, so this page doesn't
// need to know or care which path was used. v-if/v-else (not v-show) fully unmounts the inactive
// panel on switch, rather than leaving stale state sitting around in a hidden component.
import type { Event } from '../../shared/types'

const mode = ref<'assist' | 'manual'>('assist')
const justSubmitted = ref(false)

function handleSubmitted(_event: Event) {
  justSubmitted.value = true
}
</script>
