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
</script>
