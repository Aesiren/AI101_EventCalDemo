<template>
  <UButton
    v-if="isLeader"
    type="button"
    :color="event.baseSupport ? 'error' : 'success'"
    variant="soft"
    :aria-pressed="event.baseSupport"
    @click="toggle"
  >
    {{ event.baseSupport ? 'Revoke Base Support' : 'Grant Base Support' }}
  </UButton>
</template>

<script setup lang="ts">
// Leader-only control (US-1.12, TC-1.12-03). Renders nothing at all for a User-role account —
// defense in depth alongside the server route's own 403, and the page-level requireLeader guard
// on leader.vue. Restyled with Nuxt UI (Milestone 5); still a real <button> underneath.
import type { Event } from '../../shared/types'
import { useAuth } from '../composables/useAuth'
import { useEvents } from '../composables/useEvents'

const props = defineProps<{ event: Event }>()

const { isLeader } = useAuth()
const { setBaseSupport } = useEvents()

async function toggle() {
  await setBaseSupport(props.event.id, !props.event.baseSupport)
}
</script>
