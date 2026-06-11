// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Supabase env compatibility:
  // - SUPABASE_* (current Nuxt setup)
  // - NUXT_PUBLIC_SUPABASE_* (Nuxt public style)
  // - NEXT_PUBLIC_SUPABASE_* (for easier migration from Next.js projects)
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/fonts',
    // '@nuxt/hints' disabled: its web-vitals plugin pushes raw web-vitals
    // metrics (with DOM element refs in attribution.interactionTarget) into
    // nuxtApp.payload. Nuxt DevTools deep-watches the payload, so traverse
    // walks the whole DOM tree via parentNode/childNodes → stack overflow.
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@vueuse/motion/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    '@vueuse/nuxt'
  ],

  // Register shared UI components globally + keep default ~/components
  components: {
    dirs: [
      { path: '~/shared/ui', global: true },
      { path: '~/components', pathPrefix: false }
    ]
  },

  // Auto-import shared layer composables & utilities
  imports: {
    dirs: [
      'shared/composables',
      'shared/lib'
    ]
  },

  devtools: {
    enabled: true
  },

  vite: {
    server: {
      hmr: {
        overlay: false
      }
    }
  },

  css: ['~/assets/css/main.css'],

  // SEO
  site: {
    url: 'https://lingaphone.kz',
    name: 'Lingaphone',
    description: 'Школа английского языка для детей — Алматы оффлайн + Онлайн по всему миру. Британская методика, 13 лет опыта.',
    defaultLocale: 'ru'
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'lingaphone-color-mode'
  },

  // Runtime config for server-side secrets
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    mailgunApiKey: process.env.MAILGUN_API_KEY ?? '',
    mailgunDomain: process.env.MAILGUN_DOMAIN ?? '',
    paymentApiKey: process.env.PAYMENT_API_KEY ?? '',
    paymentMockMode: process.env.PAYMENT_MOCK_MODE ?? 'true',
    // Shared secret for server-internal $fetch calls. Routes that should
    // never be reachable from the public internet require this header.
    internalApiKey: process.env.INTERNAL_API_KEY ?? '',
    sentryDsn: process.env.SENTRY_DSN ?? '',
    public: {
      appName: 'Lingaphone',
      sentryDsn: process.env.SENTRY_DSN ?? '',
      turnServerUrl: process.env.TURN_SERVER_URL ?? '',
      turnServerUser: process.env.TURN_SERVER_USER ?? '',
      turnServerCredential: process.env.TURN_SERVER_CREDENTIAL ?? '',
      // Demo capsule mode: when true, allows free layer switching/progression.
      capsuleDemoFreeSwitch: process.env.NUXT_PUBLIC_CAPSULE_DEMO_FREE_SWITCH ?? 'true'
    }
  },

  routeRules: {
    '/': { isr: 3600 },
    '/about': { isr: 86400 },
    '/contact': { isr: 86400 },
    '/privacy': { isr: 86400 },
    '/terms': { isr: 86400 },
    '/programs/**': { isr: 3600 }
  },

  devServer: {
    port: 3000
  },

  compatibilityDate: '2025-01-15',

  // Nitro server config
  nitro: {
    experimental: {
      tasks: true
    },
    devServer: {
      // httpHeaderMaxLength removed — not supported in current Nitro version
    },
    scheduledTasks: {
      // Run early warning check daily at 9:00 AM
      '0 9 * * *': ['early-warning']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700, 800], subsets: ['cyrillic', 'latin'] },
      { name: 'Manrope', provider: 'google', weights: [700, 800, 900], subsets: ['cyrillic', 'latin'] }
    ]
  },

  // i18n — Russian/Kazakh
  i18n: {
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'kz', name: 'Қазақша', file: 'kz.json' }
    ],
    defaultLocale: 'ru',
    langDir: 'locales',
    strategy: 'no_prefix'
  },

  ogImage: {
    enabled: false
  },

  robots: {
    disallow: ['/student/', '/parent/', '/teacher/', '/admin/', '/lesson/', '/messenger/', '/confirm']
  },

  sitemap: {
    exclude: [
      '/student/**',
      '/parent/**',
      '/teacher/**',
      '/admin/**',
      '/lesson/**',
      '/messenger/**',
      '/confirm'
    ]
  },

  // Supabase configuration
  supabase: {
    redirect: true,
    types: '~/shared/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: [
        '/student',
        '/student/**',
        '/parent',
        '/parent/**',
        '/teacher',
        '/teacher/**',
        '/admin',
        '/admin/**',
        '/lesson',
        '/lesson/**',
        '/messenger',
        '/messenger/**'
      ],
      exclude: [
        '/',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
        '/blog(/*)?',
        '/programs(/*)?',
        '/diagnostics(/*)?',
        '/trial(/*)?',
        '/play(/*)?',
        '/battle(/*)?'
      ]
    },
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production'
    },
    url: process.env.SUPABASE_URL
      ?? process.env.NUXT_PUBLIC_SUPABASE_URL
      ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SECRET_KEY
      ?? process.env.SUPABASE_SERVICE_KEY,
    key: process.env.SUPABASE_KEY
      ?? process.env.NUXT_PUBLIC_SUPABASE_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  }
})
