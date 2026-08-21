<template>
  <main>
    <h1 class="text-2xl font-bold mb-6">Events</h1>
    <UAlert
      v-if="events.length === 0"
      class="empty-state"
      color="neutral"
      variant="soft"
      title="No events have been submitted yet."
    />
    <ul v-else class="event-list flex flex-col gap-3">
      <li v-for="event in events" :key="event.id">
        <UCard variant="subtle">
          <div class="flex items-center justify-between gap-4">
            <NuxtLink :to="`/events/${event.id}`" class="font-semibold text-highlighted hover:underline">
              {{ event.name }}
            </NuxtLink>
            <VoteCount :event="event" />
          </div>
        </UCard>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
// Minimal event list (US-1.1, US-1.2 revised) — name + vote count only; every other field moved
// to the event's own detail page (US-1.14, app/pages/events/[id].vue). Restyled with Nuxt UI
// (Milestone 5). VoteCount is left to Nuxt's component auto-import, same as EventCard was before
// it; useEvents is imported explicitly per project convention.
import { useEvents } from '../../composables/useEvents'

const { events, refresh } = useEvents()
await refresh()
</script>
