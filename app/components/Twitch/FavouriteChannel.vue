<template>
  <NuxtLink
    :to="`/channel/${channel?.login}`"
    class="hover:bg-primary-100 dark:hover:bg-primary-800 flex items-center gap-2 rounded-full bg-gray-200 p-1 shadow transition-transform duration-200 hover:scale-95 hover:shadow-md dark:bg-gray-900"
  >
    <UChip size="md" position="top-right" inset :ui="{ base: '-mx-2 rounded-none ring-0', background: '' }">
      <UAvatar
        :ui="{ wrapper: ringStyle }"
        :src="channel?.profile_image_url"
        :alt="channel?.display_name"
        size="md"
      />

      <template #content>
        <UIcon v-if="channel?.broadcaster_type === 'partner'" name="pajamas:partner-verified" class="text-primary-500 dark:text-primary-400 text-sm" />
      </template>
    </UChip>
    <span class="overflow-hidden text-ellipsis font-semibold text-gray-800 dark:text-gray-200">
      {{ channel?.display_name }}
    </span>
  </NuxtLink>
</template>

<script lang="ts" setup>
const props = defineProps<{
  channel: TwitchUser
}>()

const ringStyle = computed(() => {
  if (props.channel?.broadcaster_type === 'partner') {
    return 'ring-2 ring-primary-500 dark:ring-primary-500'
  }
  else {
    return 'ring-2 ring-gray-500 dark:ring-gray-500'
  }
})
</script>
