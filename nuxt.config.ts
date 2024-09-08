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
  tailwindcss: {
    cssPath: '~/assets/global.css',
  },
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
    },
    devStorage: {
      cache: {
        driver: 'memory',
      },
    },
  },
  sourcemap: {
    server: false,
  },
})
