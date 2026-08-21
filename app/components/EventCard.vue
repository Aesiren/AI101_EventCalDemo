<template>
  <article class="event-card">
    <h3 class="text-xl font-bold mb-2">{{ event.name }}</h3>
    <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm mb-3">
      <dt class="text-muted">Location</dt>
      <dd>{{ event.location }}</dd>
      <dt class="text-muted">Type</dt>
      <dd>{{ event.type }}</dd>
      <dt class="text-muted">When</dt>
      <dd>{{ event.dateTime }}</dd>
      <dt class="text-muted">Description</dt>
      <dd>{{ event.description }}</dd>
    </dl>
    <UBadge :data-base-support="event.baseSupport" :color="event.baseSupport ? 'success' : 'neutral'" variant="subtle">
      {{ event.baseSupport ? 'Base Support: Approved' : 'Base Support: Not yet approved' }}
    </UBadge>
  </article>
</template>

<script setup lang="ts">
// Restyled with Nuxt UI (Milestone 5) — a UBadge replaces the old bare <p>, kept the same
// data-base-support attribute so existing tests are unaffected.
import type { Event } from '../../shared/types'

defineProps<{ event: Event }>()
</script>
