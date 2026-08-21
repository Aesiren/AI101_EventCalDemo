<template>
  <div class="vote-count">
    <span>{{ voteCount }} {{ voteCount === 1 ? 'vote' : 'votes' }}</span>
    <div v-if="volunteers" data-section="volunteers">
      <p v-if="volunteers.length === 0">No volunteers yet.</p>
      <ul v-else>
        <li v-for="name in volunteers" :key="name">{{ name }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// Read-only vote total + (Leader-only) volunteer names (US-2.4, TC-2.4-01). Leaders don't vote
// through this view, so this is deliberately not VoteControls with its buttons hidden; it's a
// separate, simpler component. Fetches on mount, same reasoning as VoteControls: keeps the
// hosting page (leader.vue) from needing its own per-event fetch orchestration.
//
// volunteers comes back undefined for a non-Leader viewer (see interest.get.ts) — that's the only
// signal this component needs; it doesn't check the role itself.
import type { Event } from '../../shared/types'
import { useEvents } from '../composables/useEvents'

const props = defineProps<{ event: Event }>()
const { fetchInterest } = useEvents()

const voteCount = ref(0)
const volunteers = ref<string[] | undefined>(undefined)

onMounted(async () => {
  const summary = await fetchInterest(props.event.id)
  voteCount.value = summary.voteCount
  volunteers.value = summary.volunteers
})
</script>
