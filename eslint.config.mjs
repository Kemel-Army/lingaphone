// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Supabase client returns loosely typed data — `any` is unavoidable
    // in composables and server routes that work with dynamic DB queries.
    '@typescript-eslint/no-explicit-any': 'warn'
  }
})
