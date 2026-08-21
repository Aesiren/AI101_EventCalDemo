<template>
  <main>
    <h1 class="text-2xl font-bold mb-6">Top Voted Events</h1>
    <UAlert
      v-if="ranked.length === 0"
      class="empty-state"
      color="neutral"
      variant="soft"
      title="No events have been submitted yet."
    />
    <ul v-else class="flex flex-col gap-3">
      <li v-for="(entry, index) in ranked" :key="entry.event.id" data-rank>
        <UCard variant="subtle">
          <div class="flex items-center gap-4">
            <span class="text-lg font-bold text-muted w-8 text-center shrink-0">#{{ index + 1 }}</span>
            <div class="flex-1 min-w-0">
              <NuxtLink :to="`/events/${entry.event.id}`" class="font-semibold text-highlighted hover:underline">
                {{ entry.event.name }}
              </NuxtLink>
              <div class="mt-1.5 h-2 rounded-full bg-elevated overflow-hidden">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${barWidth(entry.voteCount)}%` }" />
              </div>
            </div>
            <span class="text-sm text-muted shrink-0">{{ entry.voteCount }} {{ entry.voteCount === 1 ? 'vote' : 'votes' }}</span>
          </div>
        </UCard>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
// Chart view (US-3.2, FR-11) — events ranked by vote count using the pure rankEventsByVotes
// helper, rendered as a simple bar chart (no external charting library — keeps the "one styling
// system" boundary from docs/05-spec.md's NFR intact). Vote counts come from
// useEvents().fetchAllInterests() (Milestone 6's composed-from-existing-endpoints approach — see
// its comment in useEvents.ts) rather than a new bulk endpoint.
// Reverted from a Milestone 7 top-two truncation — that behavior was meant for a home-screen
// preview widget, not this full page. See docs/07-milestones.md.
import { computed } from 'vue'
import { useEvents } from '../composables/useEvents'
import { rankEventsByVotes } from '../../shared/utils/rankEventsByVotes'

const { events, refresh, fetchAllInterests } = useEvents()
await refresh()
const interests = await fetchAllInterests()

const voteCounts = Object.fromEntries(
  Object.entries(interests).map(([id, summary]) => [id, summary.voteCount])
)
const ranked = computed(() => rankEventsByVotes(events.value, voteCounts))
const maxVotes = computed(() => Math.max(1, ...ranked.value.map(r => r.voteCount)))

function barWidth(voteCount: number): number {
  return Math.max(4, (voteCount / maxVotes.value) * 100)
}
</script>
