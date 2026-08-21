<template>
  <main>
    <NuxtLink to="/events">&larr; Back to events</NuxtLink>
    <EventCard v-if="event" :event="event" />
    <p v-else class="not-found">Event not found.</p>
  </main>
</template>

<script setup lang="ts">
// Individual event detail page. EventCard is left to Nuxt's component auto-import; useEvents is
// imported explicitly per project convention. useRoute is a framework auto-import too — its
// params.id is set for tests via mountSuspended's `route` option, no mocking needed.
import { useEvents } from '../../composables/useEvents'
import type { Event } from '../../../shared/types'

const route = useRoute()
const { fetchEvent } = useEvents()

const event = ref<Event | null>(null)
try {
  event.value = await fetchEvent(route.params.id as string)
} catch {
  event.value = null
}
</script>
