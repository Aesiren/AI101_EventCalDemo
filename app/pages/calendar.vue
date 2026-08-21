<template>
  <main>
    <h1 class="text-2xl font-bold mb-1">Calendar</h1>

    <div class="flex items-center justify-between mb-6">
      <UButton data-action="prev-month" variant="soft" color="neutral" icon="i-lucide-chevron-left" @click="goToPreviousMonth" />
      <p class="text-lg font-semibold">{{ monthLabel }}</p>
      <UButton data-action="next-month" variant="soft" color="neutral" icon="i-lucide-chevron-right" trailing @click="goToNextMonth" />
    </div>

    <div class="grid grid-cols-7 gap-2">
      <div v-for="weekday in WEEKDAYS" :key="weekday" class="text-center text-xs font-semibold text-muted uppercase">
        {{ weekday }}
      </div>

      <div v-for="n in leadingBlanks" :key="`blank-${n}`" />

      <UCard
        v-for="day in days"
        :key="day.date"
        :data-day="day.dayOfMonth"
        variant="subtle"
        :ui="{ body: 'p-2 sm:p-2' }"
        class="min-h-24"
      >
        <p class="text-xs font-semibold text-muted mb-1">{{ day.dayOfMonth }}</p>
        <ul class="flex flex-col gap-1">
          <li v-for="event in day.events" :key="event.id">
            <NuxtLink :to="`/events/${event.id}`" class="text-xs text-primary hover:underline block truncate">
              {{ event.name }}
            </NuxtLink>
          </li>
        </ul>
      </UCard>
    </div>
  </main>
</template>

<script setup lang="ts">
// Calendar view (US-3.1, FR-10) — a month grid using the pure groupEventsByDate helper, navigable
// month-to-month (Milestone 7, TC-3.1-04/05). Purely additive read over existing event data — no
// new server contract (Milestone 6). Previously also had a "today" panel here (Milestone 7); that
// was reverted — it was meant for a home-screen preview widget, not this full page. See
// docs/07-milestones.md.
import { computed, ref } from 'vue'
import { useEvents } from '../composables/useEvents'
import { groupEventsByDate } from '../../shared/utils/groupEventsByDate'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const { events, refresh } = useEvents()
await refresh()

// The one real read of the system clock in this page — the grid starts on the current month but
// is then navigable independently via goToPreviousMonth/goToNextMonth.
const today = new Date()
const referenceDate = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const days = computed(() => groupEventsByDate(events.value, referenceDate.value))
const leadingBlanks = computed(() => new Date(referenceDate.value.getFullYear(), referenceDate.value.getMonth(), 1).getDay())
const monthLabel = computed(() => referenceDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))

function goToPreviousMonth() {
  const d = referenceDate.value
  referenceDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

function goToNextMonth() {
  const d = referenceDate.value
  referenceDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1)
}
</script>
