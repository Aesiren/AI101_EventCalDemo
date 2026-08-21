<template>
  <div v-if="visible" class="vote-controls flex items-center gap-3">
    <span class="vote-controls__count text-sm text-muted">{{ voteCount }} {{ voteCount === 1 ? 'vote' : 'votes' }}</span>
    <UButton
      type="button"
      data-action="vote"
      :color="myInterest === 'vote' ? 'primary' : 'neutral'"
      :variant="myInterest === 'vote' ? 'solid' : 'soft'"
      :aria-pressed="myInterest === 'vote'"
      :disabled="loading"
      @click="handleCast('vote')"
    >
      {{ myInterest === 'vote' ? 'Voted' : 'Vote' }}
    </UButton>
    <UButton
      type="button"
      data-action="volunteer"
      :color="myInterest === 'volunteer' ? 'primary' : 'neutral'"
      :variant="myInterest === 'volunteer' ? 'solid' : 'soft'"
      :aria-pressed="myInterest === 'volunteer'"
      :disabled="loading"
      @click="handleCast('volunteer')"
    >
      {{ myInterest === 'volunteer' ? 'Volunteering' : 'Volunteer' }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
// Vote/volunteer controls (US-2.1-2.4). Hidden entirely on the current user's own event (TC-2.1-02,
// UI layer — the API also blocks this independently, in vote.post.ts/volunteer.post.ts) and when
// not logged in. Fetches its own vote-count/interest summary via onMounted rather than a blocking
// top-level await, so N cards' fetches don't delay the whole event list's first render.
// Restyled with Nuxt UI (Milestone 5): UButton replaces the old bare <button>s, still real
// <button> elements underneath so existing [data-action="..."] queries keep working unchanged.
import type { Event, InterestKind } from '../../shared/types'
import { useAuth } from '../composables/useAuth'
import { useEvents } from '../composables/useEvents'

const props = defineProps<{ event: Event }>()

const { currentAccount } = useAuth()
const { fetchInterest, castInterest } = useEvents()

const voteCount = ref(0)
const myInterest = ref<InterestKind | null>(null)
const loading = ref(false)

const visible = computed(
  () => !!currentAccount.value && currentAccount.value.id !== props.event.submittedBy
)

async function refreshSummary() {
  const summary = await fetchInterest(props.event.id)
  voteCount.value = summary.voteCount
  myInterest.value = summary.myInterest
}

onMounted(() => {
  if (visible.value) {
    void refreshSummary()
  }
})

async function handleCast(kind: InterestKind) {
  loading.value = true
  try {
    await castInterest(props.event.id, kind)
    await refreshSummary()
  } finally {
    loading.value = false
  }
}
</script>
