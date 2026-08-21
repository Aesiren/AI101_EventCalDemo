<template>
  <main class="max-w-xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Submit an Event</h1>

    <div class="submit-page__tabs flex gap-1 rounded-md bg-elevated p-1 mb-6" role="tablist">
      <UButton
        type="button"
        data-tab="assist"
        :aria-pressed="mode === 'assist'"
        :color="mode === 'assist' ? 'primary' : 'neutral'"
        :variant="mode === 'assist' ? 'solid' : 'ghost'"
        class="flex-1 justify-center"
        @click="mode = 'assist'"
      >
        AI Assistant
      </UButton>
      <UButton
        type="button"
        data-tab="manual"
        :aria-pressed="mode === 'manual'"
        :color="mode === 'manual' ? 'primary' : 'neutral'"
        :variant="mode === 'manual' ? 'solid' : 'ghost'"
        class="flex-1 justify-center"
        @click="mode = 'manual'"
      >
        Manual Entry
      </UButton>
    </div>

    <AiAssistPanel v-if="mode === 'assist'" @submitted="handleSubmitted" />
    <EventForm v-else @submitted="handleSubmitted" />
  </main>
</template>

<script setup lang="ts">
// Hosts both submission paths (US-1.3–US-1.9) as a tab toggle. Defaults to the AI Assistant —
// it's the actual point of this demo — with Manual Entry one click away. AiAssistPanel and
// EventForm both emit the same 'submitted' event with the created Event, so this page doesn't
// need to know or care which path was used. v-if/v-else (not v-show) fully unmounts the inactive
// panel on switch, rather than leaving stale state sitting around in a hidden component.
// Restyled with Nuxt UI (Milestone 5) — the tab toggle is two UButtons rather than bare
// <button>s, but keeps its data-tab attributes so existing tests are unaffected.
// Milestone 7: on submit, navigate straight to /calendar instead of showing an inline "thank
// you" message on the page you're about to leave — the calendar now doubles as the confirmation,
// since the just-created event shows up there.
import type { Event } from '../../shared/types'

const mode = ref<'assist' | 'manual'>('assist')

function handleSubmitted(_event: Event) {
  navigateTo('/calendar')
}
</script>
