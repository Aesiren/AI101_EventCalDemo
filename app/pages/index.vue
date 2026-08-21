<template>
  <main v-if="currentAccount">
    <h1>Welcome back, {{ currentAccount.name }}</h1>
    <nav>
      <NuxtLink to="/events">View Events</NuxtLink>
      <NuxtLink to="/submit">Submit an Event</NuxtLink>
      <NuxtLink v-if="isLeader" to="/leader">Leader Review</NuxtLink>
    </nav>
  </main>
  <main v-else>
    <p>Redirecting…</p>
  </main>
</template>

<script setup lang="ts">
// Home page. Not logged in -> /login (see resolveHomeRedirect); logged in -> a real, simple
// welcome page of its own — not a forced hand-off to /events. Getting anywhere else in the app
// is the header nav's job (app/layouts/default.vue), not this page's.
import { useAuth } from '../composables/useAuth'
import { resolveHomeRedirect } from '../utils/resolveHomeRedirect'

const { currentAccount, isLeader } = useAuth()

const redirectTo = resolveHomeRedirect(currentAccount.value)
if (redirectTo) {
  await navigateTo(redirectTo)
}
</script>
