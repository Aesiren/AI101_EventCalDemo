<template>
  <main>
    <NuxtLink to="/events">&larr; Back to events</NuxtLink>
    <template v-if="event">
      <EventCard :event="event" />
      <p class="event-detail__submitter">Submitted by {{ submitterName }}</p>
      <VoteControls :event="event" />
    </template>
    <p v-else class="not-found">Event not found.</p>
  </main>
</template>

<script setup lang="ts">
// Individual event detail page (US-1.1, US-2.1, US-2.3). EventCard/VoteControls are left to
// Nuxt's component auto-import; useEvents/useAuth are imported explicitly per project convention.
// useRoute is a framework auto-import too — its params.id is set for tests via mountSuspended's
// `route` option, no mocking needed.
import { useEvents } from '../../composables/useEvents'
import { useAuth } from '../../composables/useAuth'
import type { Event } from '../../../shared/types'

const route = useRoute()
const { fetchEvent } = useEvents()
const { listAccounts } = useAuth()

const event = ref<Event | null>(null)
const submitterName = ref('Unknown')

try {
  event.value = await fetchEvent(route.params.id as string)
  if (event.value) {
    const accounts = await listAccounts()
    submitterName.value = accounts.find(a => a.id === event.value?.submittedBy)?.name ?? 'Unknown'
  }
} catch {
  event.value = null
}
</script>
