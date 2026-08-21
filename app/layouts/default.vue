<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>Unit Morale Improvement Dashboard</h1>
      <nav>
        <NuxtLink to="/events">Events</NuxtLink>
        <NuxtLink v-if="isLeader" to="/leader">Leader Review</NuxtLink>
        <NuxtLink v-if="currentAccount" to="/submit">Submit Event</NuxtLink>
      </nav>
      <div class="app-header__account">
        <template v-if="currentAccount">
          <span>Logged in as {{ currentAccount.name }}</span>
          <button type="button" @click="handleLogout">Log Out</button>
        </template>
        <NuxtLink v-else to="/login">Log In</NuxtLink>
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// Site-wide header: title, nav (Events always; Leader Review and Submit Event once logged in;
// Leader Review specifically only for a Leader account), and a Log Out/Log In control.
import { useAuth } from '../composables/useAuth'

const { currentAccount, isLeader, logout } = useAuth()

function handleLogout() {
  logout()
  navigateTo('/login')
}
</script>
