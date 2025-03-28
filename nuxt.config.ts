/* eslint-disable node/prefer-global/process */
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: [
    '@nuxt/test-utils/module',
    '@nuxt/devtools',
    '@nuxt/fonts',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@vue-macros/nuxt',
    '@nuxt/eslint',
    '@nuxt/image',
    'nuxt-auth-utils',
    'nuxt-time',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-09-05',
  eslint: {
    config: {
      standalone: false,
    },
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  typescript: {
    typeCheck: true,
    strict: true,
  },
  experimental: {
    typedPages: true,
  },
  runtimeConfig: {
    twitchClientId: process.env.NUXT_TWITCH_CLIENT_ID,
    twitchClientSecret: process.env.NUXT_TWITCH_CLIENT_SECRET,
    oauth: {
      twitch: {
        clientId: process.env.NUXT_TWITCH_CLIENT_ID,
        clientSecret: process.env.NUXT_TWITCH_CLIENT_SECRET,
      },
    },
    public: {
      baseUrl: process.env.NUXT_BASE_URL,
    },
  },
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },
  nitro: {
    storage: {
      cache: {
        driver: 'cloudflare-kv-binding',
        binding: 'CACHE',
      },
      data: {
        driver: 'cloudflare-kv-binding',
        binding: 'DATA',
      },
    },
    devStorage: {
      cache: {
        driver: 'null',
      },
      data: {
        driver: 'fs',
        base: './.data/',
      },
    },
  },
  sourcemap: {
    server: false,
  },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error'],
      transitions: true,
    },
  },
})
