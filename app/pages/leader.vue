<template>
  <main>
    <h1>Leader Review</h1>
    <p v-if="events.length === 0" class="empty-state">
      No events have been submitted yet.
    </p>
    <ul v-else class="event-list">
      <li v-for="event in events" :key="event.id">
        <EventCard :event="event" />
        <VoteCount :event="event" />
        <BaseSupportToggle :event="event" />
        <ResourcesCommittedToggle :event="event" />
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
// Leader view (US-1.11, US-1.12). Guarded by requireLeader — a non-Leader who navigates here
// directly gets redirected before this page's content ever renders (see
// app/middleware/requireLeader.ts and its resolveLeaderRedirect for the tested decision logic).
import { useEvents } from '../composables/useEvents'

definePageMeta({ middleware: 'require-leader' })

const { events, refresh } = useEvents()
await refresh()
</script>
