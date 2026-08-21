// Nuxt UI theming (Milestone 7 — highlight color). Nuxt UI defaults `ui.colors.primary` to
// 'green'; every UButton/UBadge/focus-ring/active-nav-link that uses the 'primary' color token
// picks this up automatically, no component-level changes needed.
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue'
    }
  }
})
