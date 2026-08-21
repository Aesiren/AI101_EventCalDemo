<template>
  <form class="event-form flex flex-col gap-4" @submit.prevent="handleSubmit">
    <UAlert v-if="errors.length" class="event-form__errors" color="error" variant="soft" role="alert" :title="errors.join(', ')" />

    <label class="flex flex-col gap-1.5 text-sm font-medium">
      Name
      <UInput v-model="form.name" name="name" type="text" :aria-invalid="hasError('name')" />
    </label>

    <label class="flex flex-col gap-1.5 text-sm font-medium">
      Location
      <UInput v-model="form.location" name="location" type="text" :aria-invalid="hasError('location')" />
    </label>

    <label class="flex flex-col gap-1.5 text-sm font-medium">
      Type
      <select v-model="form.type" name="type" class="app-select" :aria-invalid="hasError('type')">
        <option value="" disabled>Select a type</option>
        <option v-for="eventType in EVENT_TYPES" :key="eventType" :value="eventType">
          {{ eventType }}
        </option>
      </select>
    </label>

    <label class="flex flex-col gap-1.5 text-sm font-medium">
      Description
      <UTextarea v-model="form.description" name="description" :aria-invalid="hasError('description')" />
    </label>

    <label class="flex flex-col gap-1.5 text-sm font-medium">
      When
      <UInput v-model="form.dateTime" name="dateTime" type="datetime-local" :aria-invalid="hasError('dateTime')" />
    </label>

    <UButton type="submit" block>Submit Event</UButton>
  </form>
</template>

<script setup lang="ts">
// Manual event submission (US-1.3, US-1.4). Validation reuses shared/eventValidation.ts — the
// exact same rule the server enforces — so client feedback and server enforcement can't drift
// apart. On success, creates the event via useEvents() and emits it for the parent page to react
// to (navigation, confirmation, etc.) rather than deciding that here.
// Restyled with Nuxt UI (Milestone 5): UInput/UTextarea/UButton/UAlert replace the old bare
// elements for text/textarea/submit/error — each still renders a real native input/textarea
// under the hood, so [name="..."] queries and .setValue() keep working unchanged. The type field
// stays a native <select> (see login.vue's comment for why) styled via the .app-select class.

import { EVENT_TYPES } from '../../shared/types'
import type { Event, EventType } from '../../shared/types'
import { validateCreateEventInput } from '../../shared/eventValidation'
import { useEvents } from '../composables/useEvents'

const emit = defineEmits<{ submitted: [event: Event] }>()

const form = reactive<{
  name: string
  location: string
  type: EventType | ''
  description: string
  dateTime: string
}>({
  name: '',
  location: '',
  type: '',
  description: '',
  dateTime: ''
})

const errors = ref<string[]>([])

function hasError(field: string): boolean {
  return errors.value.some(e => e.startsWith(field))
}

async function handleSubmit() {
  const result = validateCreateEventInput(form)
  if (!result.valid) {
    errors.value = result.errors
    return
  }
  errors.value = []

  // Snapshot to a plain object before handing it off — result.value is the same reactive
  // object as `form`, not a copy, so passing it directly would let the reset below mutate
  // the payload out from under createEvent() while its request is still in flight.
  const payload = { ...result.value }

  const { createEvent } = useEvents()
  let created: Event
  try {
    created = await createEvent(payload)
  } catch {
    // e.g. a 401 if the session expired/was never established — surfaced the same way
    // validation errors are, rather than an unhandled rejection with no user feedback.
    errors.value = ['Submission failed. Please make sure you are logged in and try again.']
    return
  }
  emit('submitted', created)

  form.name = ''
  form.location = ''
  form.type = ''
  form.description = ''
  form.dateTime = ''
}
</script>
