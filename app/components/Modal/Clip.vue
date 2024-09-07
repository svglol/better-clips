<template>
  <UModal :ui="{ width: 'sm:!max-w-[calc(100vw-12rem)] lg:!max-w-[calc(100vw-10vw)] 2xl:!max-w-[calc(100vw-30vw)] xl:m-20 h-auto', container: '!items-center' }">
    <div class="aspect-w-16 aspect-h-9 relative w-full">
      <iframe
        :src="iframeSrc"
        class="absolute inset-0 size-full"
        allowfullscreen
        style="border: none;"
      />
    </div>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: string
}>()

const { data } = await useFetch<TwitchAPIResponse<TwitchClip>>(`/api/twitch/clips/${props.id}`)
if (data.value && data.value.data && data.value.data.length > 0) {
  const clip = data.value.data[0]
  if (clip) {
    useSeoMeta({
      title: `${clip.title} - ${clip.broadcaster_name}`,
    })
  }
}
const iframeSrc = computed(() => {
  const { hostname } = new URL(window.location.href)
  return `https://clips.twitch.tv/embed?clip=${props.id}&parent=${hostname}&autoplay=true`
})
</script>
