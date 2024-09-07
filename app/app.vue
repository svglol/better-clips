<template>
  <NuxtLayout class=" font-sans text-gray-500 antialiased dark:text-gray-400">
    <NuxtLoadingIndicator
      :color="false"
      class="bg-gradient-to-r from-cyan-300 via-blue-500 to-sky-600"
      :duration="1000"
    />
    <NuxtPage />
    <UNotifications />
    <UModals />
  </NuxtLayout>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const baseUrl = config.public.baseUrl || 'https://better-clips.trotman.xyz'
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} • Better Twitch Clips🎬`
      : 'Better Twitch Clips Browser 🎬'
  },
  htmlAttrs: {
    lang: 'en',
  },
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
  ],
})

useSeoMeta({
  ogTitle: 'Better Twitch Clips🎬',
  twitterTitle: 'Better Twitch Clips🎬',
  description: 'A better way to browse Twitch clips.',
  ogDescription: 'A better way to browse Twitch clips.',
  twitterDescription: 'A better way to browse Twitch clips.',
  ogUrl: 'https://better-clips.trotman.xyz',
  twitterCard: 'summary',
  ogImage: `${baseUrl}/og.png`,
  twitterImage: `${baseUrl}/og.png`,
})
</script>
