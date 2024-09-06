<template>
  <NuxtLink :to="`/channel/${name}`" class="flex w-full max-w-56 flex-col items-center gap-4 rounded bg-gray-100 p-2 shadow transition-all hover:scale-[97%] hover:opacity-80 dark:bg-gray-900">
    <USkeleton v-if="loading" class="size-20 rounded-full" />
    <UAvatar v-else :src="channel?.profile_image_url" size="3xl" class="rounded-full" />
    <span class="text-lg text-gray-800 dark:text-gray-200">{{ name }}</span>
  </NuxtLink>
</template>

<script lang="ts" setup>
const props = defineProps<{
  name: string
}>()

const loading = ref(true)
const channel = ref<TwitchUser | null>(null)
onMounted(async () => {
  try {
    const data = await $fetch<TwitchAPIResponse<TwitchUser>>(`/api/twitch/channels/${props.name}`, { query: { id: props.name } })
    if (data.data[0])
      channel.value = data.data[0]
  }
  catch (error) {
    console.error('Failed to load channel data', error)
  }
  finally {
    loading.value = false
  }
})
</script>
