<template>
  <UModal :ui="{ width: 'm-0 sm:!max-w-[calc(100vw-12rem)] lg:!max-w-[calc(100vw-10vw)] 2xl:!max-w-[calc(100vw-30vw)] xl:m-20 h-auto', container: '!items-center !p-2' }">
    <div class="flex flex-col">
      <div class="aspect-w-16 aspect-h-9 relative w-full">
        <iframe
          :src="iframeSrc"
          class="absolute inset-0 size-full"
          allowfullscreen
          style="border: none;"
        />
      </div>
      <div class="flex flex-row-reverse gap-4 p-2 sm:p-4">
        <UTooltip text="Download">
          <UButton icon="i-heroicons-arrow-down-tray" color="primary" class="flex-none" :to="videoUrl" _target="_blank" size="sm" variant="ghost" />
        </UTooltip>
        <UTooltip text="Share">
          <UButton icon="i-heroicons-share" color="primary" class="flex-none" size="sm" variant="ghost" @click="startShare" />
        </UTooltip>
        <UTooltip v-if="clip?.url" text="Open in Twitch">
          <UButton icon="ic:sharp-launch" color="primary" class="flex-none" size="sm" variant="ghost" :to="clip?.url" _target="_blank" @click="openInTwitch" />
        </UTooltip>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: string
}>()

const clip = ref<TwitchClip | undefined>()
const videoUrl = computed(() => clip.value?.thumbnail_url.replace('-preview-480x272.jpg', '.mp4'))

const data = await $fetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips/${props.id}`)
if (data && data.data && data.data.length > 0) {
  clip.value = data.data[0]
  if (clip.value) {
    useSeoMeta({
      title: `${clip.value.title} - ${clip.value.broadcaster_name}`,
    })
  }
}
const iframeSrc = computed(() => {
  const { hostname } = new URL(window.location.href)
  return `https://clips.twitch.tv/embed?clip=${props.id}&parent=${hostname}&autoplay=true`
})

const { share } = useShare()

function startShare() {
  share({
    title: document.title,
    url: location.href,
  })
}

function openInTwitch(event: MouseEvent) {
  event.preventDefault()
  if (clip.value) {
    window.open(clip.value?.url, '_blank')
  }
}
</script>
