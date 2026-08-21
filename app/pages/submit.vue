<template>
  <main>
    <h1>Submit an Event</h1>
    <EventForm @submitted="handleSubmitted" />
    <p v-if="justSubmitted" role="status">Event submitted — thank you!</p>
  </main>
</template>

<script setup lang="ts">
// Hosts EventForm (US-1.3, US-1.4) — manual path only for now. The AI-assisted path
// (AiAssistPanel) gets wired in alongside this during Milestone 3.
import type { Event } from '../../shared/types'

const justSubmitted = ref(false)

function handleSubmitted(_event: Event) {
  justSubmitted.value = true
}
</script>
