<template>
  <main v-if="currentAccount">
    <h1 class="text-2xl font-bold">Welcome back, {{ currentAccount.name }}</h1>
    <p class="text-muted mb-6">Pick a section to jump in.</p>
    <div class="dashboard-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="section in sections"
        :key="section.to"
        :to="section.to"
        class="dashboard-card"
      >
        <UCard variant="subtle" class="h-full hover:ring-2 hover:ring-primary transition-shadow">
          <div class="flex items-center gap-3">
            <UIcon :name="section.icon" class="size-6 text-primary shrink-0" />
            <div class="min-w-0">
              <p class="font-semibold text-highlighted">{{ section.label }}</p>

              <p v-if="section.to === '/calendar'" data-section="calendar-preview" class="text-sm text-muted truncate">
                <template v-if="todayEvents.length">Today: {{ todayEvents.map(e => e.name).join(', ') }}</template>
                <template v-else>No events today.</template>
              </p>

              <div v-else-if="section.to === '/votes'" data-section="top-voted-preview" class="text-sm text-muted">
                <template v-if="topVoted.length">
                  <p v-for="(entry, i) in topVoted" :key="entry.event.id" class="truncate">
                    {{ i + 1 }}. {{ entry.event.name }}
                  </p>
                </template>
                <p v-else>No events have been submitted yet.</p>
              </div>

              <p v-else class="text-sm text-muted">{{ section.description }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </main>
  <main v-else>
    <p>Redirecting…</p>
  </main>
</template>

<script setup lang="ts">
// Home page (US-3.4) — not logged in -> /login (see resolveHomeRedirect); logged in -> a
// dashboard tile per navigable section, role-filtered (Leader Review only for a Leader account).
// Getting anywhere else in the app besides these tiles is the header nav's job
// (app/layouts/default.vue), not this page's. Restyled with Nuxt UI (Milestone 5).
//
// The Calendar and Top Voted tiles show a live preview instead of a static description — today's
// event(s) and the top two voted events, respectively (per your Milestone 7 clarification: this
// is where those two behaviors were meant to live, not on the full /calendar and /votes pages,
// which were reverted — see docs/07-milestones.md). Each tile still links through to its full
// page; the preview isn't itself a set of separate links (nesting an <a> inside the tile's own
// NuxtLink isn't valid HTML), just a glance at what's there.
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useEvents } from '../composables/useEvents'
import { resolveHomeRedirect } from '../utils/resolveHomeRedirect'
import { filterEventsOnDate } from '../../shared/utils/groupEventsByDate'
import { rankEventsByVotes } from '../../shared/utils/rankEventsByVotes'

const { currentAccount, isLeader } = useAuth()

const redirectTo = resolveHomeRedirect(currentAccount.value)
if (redirectTo) {
  await navigateTo(redirectTo)
}

const { events, refresh, fetchAllInterests } = useEvents()
let voteCounts: Record<string, number> = {}
if (currentAccount.value) {
  await refresh()
  const interests = await fetchAllInterests()
  voteCounts = Object.fromEntries(Object.entries(interests).map(([id, summary]) => [id, summary.voteCount]))
}

const todayEvents = computed(() => filterEventsOnDate(events.value, new Date()))
const topVoted = computed(() => rankEventsByVotes(events.value, voteCounts).slice(0, 2))

const sections = computed(() => {
  const items = [
    { to: '/events', label: 'View Events', description: 'Browse everything submitted so far.', icon: 'i-lucide:list' },
    { to: '/submit', label: 'Submit an Event', description: 'Add a new event, manually or with AI help.', icon: 'i-lucide:circle-plus' },
    { to: '/calendar', label: 'Calendar', description: 'See what\'s happening, day by day.', icon: 'i-lucide:calendar-days' },
    { to: '/votes', label: 'Top Voted', description: 'See which event ideas have the most support.', icon: 'i-lucide:bar-chart-3' },
    { to: '/needs-voting', label: 'Needs Your Vote', description: 'Events you haven\'t weighed in on yet.', icon: 'i-lucide:vote' }
  ]
  if (isLeader.value) {
    items.push({ to: '/leader', label: 'Leader Review', description: 'Approve Base support and track resources.', icon: 'i-lucide:shield-check' })
  }
  return items
})
</script>
