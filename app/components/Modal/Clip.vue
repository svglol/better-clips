<template>
  <UModal :ui="{ content: 'sm:!max-w-[calc(100vw-12rem)] lg:!max-w-[calc(100vw-10vw)] 2xl:!max-w-[calc(100vw-30vw)]' }">
    <template #content>
      <div class="flex flex-col">
        <div class="relative aspect-video w-full">
          <iframe
            :src="iframeSrc"
            class="size-full"
            allowfullscreen
            style="border: none;"
          />
        </div>
        <div class="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div class="flex max-w-full flex-col gap-1 overflow-hidden">
            <span class="text-(--ui-text-muted) text-xs">{{ time }}</span>
            <h2 class="text-(--ui-text-highlighted) max-w-full truncate text-base font-semibold leading-tight">
              {{ clip?.title }}
            </h2>
            <p class="text-(--ui-text-dimmed) text-xs leading-tight">
              <span class="inline-flex flex-wrap items-center gap-x-1">
                Clipped by
                <NuxtLink :to="`https://twitch.tv/${clip?.creator_name.replace(' ', '')}`" target="_blank" class="text-primary hover:underline">
                  {{ clip?.creator_name }}
                </NuxtLink>
                on
                <NuxtLink :to="`/channel/${clip?.broadcaster_name.replace(' ', '')}`" target="_blank" class="text-primary hover:underline">
                  {{ clip?.broadcaster_name }}
                </NuxtLink>
                •
                <span>{{ formatNumberWithCommas(clip?.view_count ?? 0) }} views</span>
              </span>
            </p>
          </div>
          <div class="flex flex-shrink-0 flex-row gap-2">
            <UTooltip text="Share">
              <UButton icon="i-heroicons-share" color="primary" size="sm" variant="ghost" @click="startShare" />
            </UTooltip>
            <UTooltip v-if="clip?.url" text="Open on Twitch">
              <UButton icon="ic:sharp-launch" color="primary" size="sm" variant="ghost" :to="clip?.url" target="_blank" />
            </UTooltip>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const props = defineProps<{
  id: string
  clip?: TwitchClip
}>()

const clip = ref<TwitchClip | undefined>(props.clip)
const iframeSrc = computed(() => {
  const { hostname } = new URL(window.location.href)
  return `https://clips.twitch.tv/embed?clip=${props.id}&parent=${hostname}&autoplay=true`
})

if (!props.clip) {
  const data = await $fetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips/${props.id}`)
  if (data && data.data && data.data.length > 0) {
    clip.value = data.data[0]
  }
}

if (clip.value) {
  useSeoMeta({
    title: `${clip.value.title} - ${clip.value.broadcaster_name}`,
  })
}
const { share } = useShare()

function startShare() {
  share({
    title: document.title,
    url: location.href,
  })
}

function formatNumberWithCommas(number: number): string {
  return new Intl.NumberFormat().format(number)
}

const time = computed(() => {
  if (!clip.value?.created_at)
    return ''

  const createdDate = new Date(clip.value.created_at)
  const now = new Date()
  const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)

  if (hoursDiff < 20) {
    return formatTimeAgo(createdDate)
  }
  else {
    return createdDate.toLocaleDateString()
  }
})
</script>
