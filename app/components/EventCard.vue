<template>
  <article class="event-card">
    <h3>{{ event.name }}</h3>
    <dl>
      <dt>Location</dt>
      <dd>{{ event.location }}</dd>
      <dt>Type</dt>
      <dd>{{ event.type }}</dd>
      <dt>When</dt>
      <dd>{{ event.dateTime }}</dd>
      <dt>Description</dt>
      <dd>{{ event.description }}</dd>
    </dl>
    <p :data-base-support="event.baseSupport">
      {{ event.baseSupport ? 'Base Support: Approved' : 'Base Support: Not yet approved' }}
    </p>
  </article>
</template>

<script setup lang="ts">
import type { Event } from '../../shared/types'

defineProps<{ event: Event }>()
</script>
