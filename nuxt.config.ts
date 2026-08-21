// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Styling library (Milestone 5 / US-3.5, docs/05-spec.md's NFR) — brings its own Tailwind CSS 4
  // dependency along; no separate @nuxtjs/tailwindcss module needed.
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
