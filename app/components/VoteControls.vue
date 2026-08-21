<template>
  <div v-if="visible" class="vote-controls">
    <span class="vote-controls__count">{{ voteCount }} {{ voteCount === 1 ? 'vote' : 'votes' }}</span>
    <button
      type="button"
      data-action="vote"
      :aria-pressed="myInterest === 'vote'"
      :disabled="loading"
      @click="handleCast('vote')"
    >
      {{ myInterest === 'vote' ? 'Voted' : 'Vote' }}
    </button>
    <button
      type="button"
      data-action="volunteer"
      :aria-pressed="myInterest === 'volunteer'"
      :disabled="loading"
      @click="handleCast('volunteer')"
    >
      {{ myInterest === 'volunteer' ? 'Volunteering' : 'Volunteer' }}
    </button>
  </div>
</template>

<script setup lang="ts">
// Vote/volunteer controls (US-2.1-2.4). Hidden entirely on the current user's own event (TC-2.1-02,
// UI layer — the API also blocks this independently, in vote.post.ts/volunteer.post.ts) and when
// not logged in. Fetches its own vote-count/interest summary via onMounted rather than a blocking
// top-level await, so N cards' fetches don't delay the whole event list's first render.
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
