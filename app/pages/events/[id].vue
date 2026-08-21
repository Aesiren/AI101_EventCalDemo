<template>
  <main class="max-w-2xl mx-auto">
    <UButton to="/events" variant="link" color="neutral" icon="i-lucide:arrow-left" class="mb-4 px-0">
      Back to events
    </UButton>
    <template v-if="event">
      <UCard variant="subtle">
        <EventCard :event="event" />
        <p class="event-detail__submitter text-sm text-muted mt-3">Submitted by {{ submitterName }}</p>
        <USeparator class="my-4" />
        <VoteControls :event="event" />
      </UCard>
    </template>
    <UAlert v-else class="not-found" color="neutral" variant="soft" title="Event not found." />
  </main>
</template>

<script setup lang="ts">
// Individual event detail page (US-1.1, US-1.14, US-2.1, US-2.3). EventCard/VoteControls are left
// to Nuxt's component auto-import; useEvents/useAuth are imported explicitly per project
// convention. useRoute is a framework auto-import too — its params.id is set for tests via
// mountSuspended's `route` option, no mocking needed. Restyled with Nuxt UI (Milestone 5).
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
