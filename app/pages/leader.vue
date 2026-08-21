<template>
  <main>
    <h1 class="text-2xl font-bold mb-6">Leader Review</h1>
    <UAlert
      v-if="events.length === 0"
      class="empty-state"
      color="neutral"
      variant="soft"
      title="No events have been submitted yet."
    />
    <ul v-else class="event-list flex flex-col gap-4">
      <li v-for="event in events" :key="event.id">
        <UCard variant="subtle">
          <EventCard :event="event" />
          <USeparator class="my-4" />
          <div class="flex flex-wrap items-center gap-3">
            <VoteCount :event="event" />
            <BaseSupportToggle :event="event" />
            <ResourcesCommittedToggle :event="event" />
          </div>
        </UCard>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
// Leader view (US-1.11, US-1.12). Guarded by requireLeader — a non-Leader who navigates here
// directly gets redirected before this page's content ever renders (see
// app/middleware/requireLeader.ts and its resolveLeaderRedirect for the tested decision logic).
// Restyled with Nuxt UI (Milestone 5).
import { useEvents } from '../composables/useEvents'

definePageMeta({ middleware: 'require-leader' })

const { events, refresh } = useEvents()
await refresh()
</script>
