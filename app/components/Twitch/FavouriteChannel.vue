<template>
  <NuxtLink :to="`/channel/${channel?.login}`" class="flex flex-row items-center gap-2 rounded bg-gray-100 p-2 shadow transition-all hover:scale-[97%] hover:opacity-80 dark:bg-gray-900">
    <UAvatar :src="channel?.profile_image_url" class="flex-none rounded-full" />
    <span class="text-primary-800 overflow-hidden text-ellipsis dark:text-gray-200">{{ channel?.display_name }}</span>
  </NuxtLink>
</template>

<script lang="ts" setup>
defineProps<{
  channel: TwitchUser
}>()
</script>
