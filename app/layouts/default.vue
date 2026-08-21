<template>
  <div>
    <UHeader :toggle="false" :ui="{ root: 'app-header' }">
      <template #title>
        <NuxtLink to="/" class="font-semibold">Unit Morale Improvement Dashboard</NuxtLink>
      </template>

      <UNavigationMenu :items="navItems" />

      <template #right>
        <div class="app-header__account flex items-center gap-3">
          <template v-if="currentAccount">
            <span class="text-sm text-muted">Logged in as {{ currentAccount.name }}</span>
            <UButton type="button" color="neutral" variant="soft" @click="handleLogout">Log Out</UButton>
          </template>
          <UButton v-else type="button" to="/login" color="primary" variant="soft">Log In</UButton>
        </div>
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>

<script setup lang="ts">
// Site-wide header: title, nav (Events always; Leader Review and Submit Event once logged in;
// Leader Review specifically only for a Leader account), and a Log Out/Log In control.
// Restyled with Nuxt UI (Milestone 5, US-3.5) — UHeader/UNavigationMenu/UButton/UContainer replace
// the old bare <header>/<nav>/<button> markup, but the underlying interactive elements are still
// plain <a>/<button> tags under the hood, so existing tests targeting a[href]/button keep working.
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const { currentAccount, isLeader, logout } = useAuth()

const navItems = computed(() => {
  // Events/Calendar/Votes are public reads — viewable whether or not anyone's logged in, same as
  // events/index.vue itself has no login gate. Needs Voting requires a "current viewer" to filter
  // against (requireLogin.ts), so it's conditional on login, same as Submit Event.
  const items = [
    { label: 'Events', to: '/events' },
    { label: 'Calendar', to: '/calendar' },
    { label: 'Top Voted', to: '/votes' }
  ]
  if (isLeader.value) {
    items.push({ label: 'Leader Review', to: '/leader' })
  }
  if (currentAccount.value) {
    items.push({ label: 'Needs Voting', to: '/needs-voting' })
    items.push({ label: 'Submit Event', to: '/submit' })
  }
  return [items]
})

function handleLogout() {
  logout()
  navigateTo('/login')
}
</script>
