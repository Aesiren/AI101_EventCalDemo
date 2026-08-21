<template>
  <main>
    <p>Redirecting…</p>
  </main>
</template>

<script setup lang="ts">
// Home page — a pure redirect gate, not content of its own. Not logged in -> /login; logged in
// (either role) -> /events. The event list itself moved to app/pages/events/index.vue.
import { useAuth } from '../composables/useAuth'
import { resolveHomeRedirect } from '../utils/resolveHomeRedirect'

const { currentAccount } = useAuth()
await navigateTo(resolveHomeRedirect(currentAccount.value))
</script>
