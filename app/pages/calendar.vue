<template>
  <main>
    <h1 class="text-2xl font-bold mb-1">Calendar</h1>
    <p class="text-muted mb-6">{{ monthLabel }}</p>

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
// Calendar view (US-3.1, FR-10) — a month grid using the pure groupEventsByDate helper.
// `referenceDate` is read once from the system clock here (the one place in the app allowed to —
// everywhere else that needs "now" takes it as a parameter, same as store.ts's injectable clock);
// tests control it via Vitest's fake timers instead. Purely additive read over existing event
// data — no new server contract (Milestone 6).
import { computed } from 'vue'
import { useEvents } from '../composables/useEvents'
import { groupEventsByDate } from '../../shared/utils/groupEventsByDate'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const { events, refresh } = useEvents()
await refresh()

const referenceDate = new Date()
const days = computed(() => groupEventsByDate(events.value, referenceDate))
const leadingBlanks = computed(() => new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1).getDay())
const monthLabel = computed(() => referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
</script>
