<template>
  <main>
    <h1>Events</h1>
    <p v-if="events.length === 0" class="empty-state">
      No events have been submitted yet.
    </p>
    <ul v-else class="event-list">
      <li v-for="event in events" :key="event.id">
        <NuxtLink :to="`/events/${event.id}`">
          <EventCard :event="event" />
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
// Event list (US-1.1, US-1.2). Moved here from app/pages/index.vue, which is now the site's
// home/redirect gate — see app/pages/index.vue and docs/07-milestones.md for why.
// EventCard is left to Nuxt's component auto-import (standard for template-only usage);
// useEvents is imported explicitly per project convention.
import { useEvents } from '../../composables/useEvents'

const { events, refresh } = useEvents()
await refresh()
</script>
