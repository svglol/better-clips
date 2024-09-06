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
    apiToken: '',
    twitchClientId: '',
    twitchClientSecret: '',
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
  },
})
