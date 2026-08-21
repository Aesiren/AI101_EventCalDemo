<template>
  <main class="max-w-sm mx-auto">
    <UCard variant="subtle">
      <h1 class="text-xl font-bold mb-4">Log In</h1>
      <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
        <label class="flex flex-col gap-1.5 text-sm font-medium">
          Account
          <select v-model="selectedName" name="account" class="app-select">
            <option value="" disabled>Select an account</option>
            <option v-for="account in accounts" :key="account.id" :value="account.name">
              {{ account.name }} ({{ account.role }})
            </option>
          </select>
        </label>
        <UButton type="submit" :disabled="!selectedName" block>Log In</UButton>
        <UAlert v-if="error" color="error" variant="soft" role="alert" :title="error" />
      </form>
    </UCard>
  </main>
</template>

<script setup lang="ts">
// Mock login (US-1.13). Dropdown-only by design — offering the seeded account list (rather than
// free-text entry) avoids mistyped names entirely; see useAuth.listAccounts().
// Restyled with Nuxt UI (Milestone 5), except the dropdown itself: Nuxt UI's USelect renders a
// custom listbox (Reka UI SelectTrigger/Content), not a native <select>, which would need
// pointer-event/portal choreography in tests for no real benefit in a demo. A native <select>,
// styled to match Nuxt UI's input look via the .app-select utility class (see main.css), keeps
// the dropdown-only requirement trivially testable while still fitting the shared visual language.
import { useAuth } from '../composables/useAuth'

const { listAccounts, login } = useAuth()
const accounts = await listAccounts()

const selectedName = ref('')
const error = ref('')

async function handleLogin() {
  if (!selectedName.value) {
    return
  }
  error.value = ''
  try {
    await login(selectedName.value)
    await navigateTo('/')
  } catch {
    error.value = 'Login failed. Please try again.'
  }
}
</script>
