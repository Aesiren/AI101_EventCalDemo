<template>
  <button v-if="isLeader" type="button" :aria-pressed="event.resourcesCommitted" @click="toggle">
    {{ event.resourcesCommitted ? 'Clear Resources Committed' : 'Mark Resources Committed' }}
  </button>
</template>

<script setup lang="ts">
// Leader-only control (US-2.6, TC-2.6-03). Mirrors BaseSupportToggle.vue exactly — renders
// nothing at all for a User-role account, defense in depth alongside the server route's own 403.
import type { Event } from '../../shared/types'
import { useAuth } from '../composables/useAuth'
import { useEvents } from '../composables/useEvents'

const props = defineProps<{ event: Event }>()

const { isLeader } = useAuth()
const { setResourcesCommitted } = useEvents()

async function toggle() {
  await setResourcesCommitted(props.event.id, !props.event.resourcesCommitted)
}
</script>
