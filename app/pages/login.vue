<template>
  <main>
    <h1>Log In</h1>
    <form @submit.prevent="handleLogin">
      <label>
        Account
        <select v-model="selectedName" name="account">
          <option value="" disabled>Select an account</option>
          <option v-for="account in accounts" :key="account.id" :value="account.name">
            {{ account.name }} ({{ account.role }})
          </option>
        </select>
      </label>
      <button type="submit" :disabled="!selectedName">Log In</button>
      <p v-if="error" role="alert">{{ error }}</p>
    </form>
  </main>
</template>

<script setup lang="ts">
// Mock login (US-1.13). Dropdown-only by design — offering the seeded account list (rather than
// free-text entry) avoids mistyped names entirely; see useAuth.listAccounts().
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
