<template>
  <main>
    <h1 class="text-2xl font-bold mb-6">Needs Your Vote</h1>
    <UAlert
      v-if="needsVoting.length === 0"
      class="empty-state"
      color="success"
      variant="soft"
      title="You've voted on everything — nice work!"
    />
    <ul v-else class="flex flex-col gap-3">
      <li v-for="event in needsVoting" :key="event.id">
        <UCard variant="subtle">
          <div class="flex items-center justify-between gap-4">
            <NuxtLink :to="`/events/${event.id}`" class="font-semibold text-highlighted hover:underline">
              {{ event.name }}
            </NuxtLink>
            <VoteControls :event="event" />
          </div>
        </UCard>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
// Needs-voting view (US-3.3, FR-12) — events the current viewer hasn't voted or volunteered on
// yet, newest first, using the pure filterNeedsVoting helper. Guarded by requireLogin — this page
// is meaningless without a "current viewer" to filter against (see requireLogin.ts). VoteControls
// is embedded per item so the prompt this page exists to give ("go weigh in on these") is
// immediately actionable, not just a list you then have to click through to the detail page for.
import { computed } from 'vue'
import { useEvents } from '../composables/useEvents'
import { useAuth } from '../composables/useAuth'
import { filterNeedsVoting } from '../../shared/utils/filterNeedsVoting'

definePageMeta({ middleware: 'require-login' })

const { events, refresh, fetchAllInterests } = useEvents()
const { currentAccount } = useAuth()

await refresh()
const interests = await fetchAllInterests()

const myInterestByEventId = Object.fromEntries(
  Object.entries(interests).map(([id, summary]) => [id, summary.myInterest])
)
const needsVoting = computed(() =>
  currentAccount.value ? filterNeedsVoting(events.value, currentAccount.value.id, myInterestByEventId) : []
)
</script>
