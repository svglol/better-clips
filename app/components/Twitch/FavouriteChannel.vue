<template>
  <NuxtLink
    :to="`/channel/${channel?.login}`"
    class="bg-(--ui-bg-elevated)/50 hover:bg-(--ui-bg-elevated) flex items-center gap-2 rounded-full  p-1 shadow transition-transform duration-200 hover:scale-95 hover:shadow-md "
  >
    <UChip size="md" position="top-right" inset :ui="{ base: '-mx-2 rounded-none ring-0 bg-neutral' }">
      <UAvatar
        :ui="{ root: ringStyle }"
        :src="channel?.profile_image_url"
        :alt="channel?.display_name"
        size="md"
      />

      <template #content>
        <UIcon v-show="isPartner" name="pajamas:partner-verified" class="text-primary-500 dark:text-primary-400 text-sm" />
      </template>
    </UChip>
    <span class="overflow-hidden text-ellipsis font-semibold text-(--ui-text-highlighted)">
      {{ channel?.display_name }}
    </span>
  </NuxtLink>
</template>

<script lang="ts" setup>
const props = defineProps<{
  channel: TwitchUser
}>()

const isPartner = computed(() => props.channel?.broadcaster_type === 'partner')

const ringStyle = computed(() => {
  if (isPartner.value) {
    return 'ring-2 ring-primary-500 dark:ring-primary-500'
  }
  else {
    return 'ring-2 ring-gray-500 dark:ring-gray-500'
  }
})
</script>
