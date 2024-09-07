<template>
  <div class="relative my-2 flex w-full flex-col gap-0 rounded-lg">
    <NuxtLink :to="clip.url" target="_blank" class="shadow transition-all hover:scale-[97%] hover:opacity-80" @click="handleClipClick">
      <div class="relative aspect-video">
        <div
          class="bg-primary-500 aspect-video h-56 w-full animate-pulse rounded-lg object-cover"
          :class="{ hidden: imageLoaded }"
        />
        <NuxtImg
          :src="clip.thumbnail_url"
          class="aspect-video size-full rounded-lg object-cover"
          :class="{ hidden: !imageLoaded }"
          placeholder
          @load="handleImageLoad"
        />
        <div class="absolute inset-0 flex flex-col justify-between p-2">
          <span class="absolute left-2 top-2 rounded bg-black bg-opacity-50 p-1 text-xs text-white">
            {{ formatDuration(clip.duration) }}
          </span>
          <span class="absolute bottom-2 left-2 rounded bg-black bg-opacity-50 p-1 text-xs text-white">
            {{ formatNumberWithCommas(clip.view_count) }} views
          </span>
          <span class="absolute bottom-2 right-2 rounded bg-black bg-opacity-50 p-1 text-xs text-white">
            {{ new Date(clip.created_at).toLocaleDateString() }}
          </span>
        </div>
      </div>
    </NuxtLink>
    <NuxtLink :to="clip.url" target="_blank" class="transition-all hover:opacity-80" @click="handleClipClick">
      <span class="max-w-full text-ellipsis font-bold text-gray-800 dark:text-gray-200">{{ truncatedTitle }}</span>
    </NuxtLink>
    <NuxtLink :to="`/channel/${clip.broadcaster_name}`" class="text-sm transition-all hover:opacity-80">
      {{ clip.broadcaster_name }}
    </NuxtLink>
    <USkeleton v-if="loadingGame" class="h-4 w-[100px]" />
    <div v-else>
      <NuxtLink :to="`/category/${game?.id}`" class="text-sm transition-all hover:opacity-80">
        {{ game?.name }}
      </NuxtLink>
    </div>
    <span class="text-sm text-gray-500">Clipped by <NuxtLink :to="`https://twitch.tv/${clip.creator_name}`" target="_blank" class="transition-all hover:opacity-80">{{ clip.creator_name }}</NuxtLink></span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  clip: TwitchClip
}>()

const emit = defineEmits<{
  (e: 'openClip', id: string): void
}>()

const truncatedTitle = computed(() => {
  const maxLength = 75
  return props.clip.title.length > maxLength ? `${props.clip.title.slice(0, maxLength)}...` : props.clip.title
})

function formatDuration(duration: number): string {
  const totalSeconds = Math.ceil(duration)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatNumberWithCommas(number: number): string {
  return new Intl.NumberFormat().format(number)
}

const imageLoaded = ref(false)
const loadingGame = ref(true)
const game = ref<TwitchGame | null>(null)

function handleImageLoad() {
  imageLoaded.value = true
}

function handleClipClick(event: MouseEvent) {
  event.preventDefault()
  emit('openClip', props.clip.id)
}

onMounted(async () => {
  try {
    const data = await $fetch <TwitchAPIResponse<TwitchGame>>(`/api/twitch/game/game`, { query: { id: props.clip.game_id } })
    if (data.data[0])
      game.value = data.data[0]
  }
  catch (error) {
    console.error('Failed to load game data', error)
  }
  finally {
    loadingGame.value = false
  }
})
</script>
