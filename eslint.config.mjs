// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      // Supabase client returns loosely typed data — `any` is unavoidable
      // in composables and server routes that work with dynamic DB queries.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Vue 3 supports multiple root nodes (fragments) — this Vue-2-era rule
      // does not apply.
      'vue/no-multiple-template-root': 'off'
    }
  },
  {
    // E2E specs favour compact arrange/act setup; purely-stylistic line rules
    // add no value here.
    files: ['tests-e2e/**/*.ts'],
    rules: {
      '@stylistic/max-statements-per-line': 'off',
      '@stylistic/member-delimiter-style': 'off'
    }
  }
)
