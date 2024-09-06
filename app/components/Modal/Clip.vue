<template>
  <UModal :ui="{ width: 'sm:max-w-[calc(100vw-58rem)] m-20 h-auto' }">
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
import { computed } from 'vue'

const props = defineProps<{
  id: string
}>()

const iframeSrc = computed(() => {
  const { hostname } = new URL(window.location.href)
  return `https://clips.twitch.tv/embed?clip=${props.id}&parent=${hostname}&autoplay=true`
})
</script>
