<template>
  <main>
    <h1>Events</h1>
    <p v-if="events.length === 0" class="empty-state">
      No events have been submitted yet.
    </p>
    <ul v-else class="event-list">
      <li v-for="event in events" :key="event.id">
        <EventCard :event="event" />
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
// Event list (US-1.1, US-1.2). EventCard is left to Nuxt's component auto-import (standard for
// template-only usage); useEvents is imported explicitly per project convention.
import { useEvents } from '../composables/useEvents'

const { events, refresh } = useEvents()
await refresh()
</script>
