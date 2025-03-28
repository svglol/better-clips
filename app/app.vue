<template>
  <NuxtLayout class="bg-(--ui-bg) font-sans antialiased ">
    <NuxtLoadingIndicator
      :color="false"
      class="to-primary-600 from-primary-300 via-primary-500 bg-gradient-to-r"
      :duration="1000"
    />
    <UApp :tooltip="{ delayDuration: 0 }">
      <NuxtPage />
    </UApp>
  </NuxtLayout>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const colorMode = useColorMode()
const baseUrl = config.public.baseUrl || 'https://better-clips.trotman.xyz'
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} • Better Clips🎬`
      : 'Better Clips🎬'
  },
  htmlAttrs: {
    lang: 'en',
  },
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
  ],
  meta: [
    {
      name: 'theme-color',
      content: colorMode.value === 'dark' ? '#212121' : '#ffffff',
    },
    {
      name: 'background-color',
      content: colorMode.value === 'dark' ? '#212121' : '#ffffff',
    },
  ],
})

watch(
  () => colorMode.value,
  () => {
    useHead({
      meta: [
        {
          name: 'theme-color',
          content: colorMode.value === 'dark' ? '#212121' : '#ffffff',
        },
        {
          name: 'background-color',
          content: colorMode.value === 'dark' ? '#212121' : '#ffffff',
        },
      ],
    })
  },
)

useSeoMeta({
  ogTitle: 'Better Clips🎬',
  twitterTitle: 'Better Clips🎬',
  description: 'A better way to browse Twitch clips.',
  ogDescription: 'A better way to browse Twitch clips.',
  twitterDescription: 'A better way to browse Twitch clips.',
  ogUrl: 'https://better-clips.trotman.xyz',
  twitterCard: 'summary',
  ogImage: `${baseUrl}/og.png`,
  twitterImage: `${baseUrl}/og.png`,
})
</script>
