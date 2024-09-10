<template>
  <div class="relative my-2 flex w-full flex-col gap-0 rounded-lg bg-gray-100 shadow transition-all hover:scale-[97%] dark:bg-gray-900">
    <NuxtLink :to="clip.url" target="_blank" class="" @click="handleClipClick">
      <div class="aspect-w-16 aspect-h-9 relative">
        <Transition :name="transition">
          <div
            v-if="!imageLoaded"
            ref="placeholder"
            :key="`placeholder-${clip.id}`"
            class="absolute aspect-video w-full animate-pulse rounded-t-lg bg-gray-200 object-cover dark:bg-gray-800"
            :style="{ height: `${(placeholder?.clientWidth ?? 0) / 16 * 9}px` }"
          />
          <NuxtImg
            v-else
            ref="image"
            :key="`image-${clip.id}`"
            :src="clip.thumbnail_url"
            class="absolute aspect-video w-full rounded-t-lg object-cover"
          />
        </Transition>
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
    <div class="flex flex-col gap-0 px-2 py-1">
      <NuxtLink :to="clip.url" target="_blank" class="group transition-all hover:opacity-80" @click="handleClipClick">
        <span class="group-hover:text-primary-500 dark:group-hover:text-primary-400 line-clamp-1 max-w-full text-ellipsis font-bold text-gray-800 dark:text-gray-200">{{ clip.title }}</span>
      </NuxtLink>

      <p class="line-clamp-1 text-xs leading-tight text-gray-500 dark:text-gray-400">
        <NuxtLink :to="`/channel/${clip?.broadcaster_name.replace(' ', '')}`" class="font-bold hover:underline">
          {{ clip?.broadcaster_name }}
        </NuxtLink> • <USkeleton v-if="loadingGame" class="h-3 w-[100px]" />
        <NuxtLink v-else :to="`/category/${game?.id}`" class="text-xs font-bold transition-all hover:underline">
          {{ game?.name }}
        </NuxtLink>
      </p>
      <p class="text-xs leading-tight text-gray-500 dark:text-gray-400">
        Clipped by
        <NuxtLink :to="`https://twitch.tv/${clip?.creator_name.replace(' ', '')}`" target="_blank" class="font-semibold hover:underline">
          {{ clip?.creator_name }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  clip: TwitchClip
}>()

const emit = defineEmits<{
  (e: 'openClip', id: string, clip: TwitchClip): void
}>()

const placeholder = ref<HTMLDivElement>()
const image = ref<HTMLImageElement>()

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

const transition = ref('fade')
const loadedImages = useState<string[]>('loadedImages', () => [])
if (loadedImages.value.includes(props.clip.thumbnail_url)) {
  transition.value = 'none'
  imageLoaded.value = true
}
else {
  watchDeep(loadedImages, () => {
    if (loadedImages.value.includes(props.clip.thumbnail_url) && !imageLoaded.value) {
      imageLoaded.value = true
    }
  })
}

function handleClipClick(event: MouseEvent) {
  event.preventDefault()
  emit('openClip', props.clip.id, props.clip)
}

const gameData = useState<Map<string, TwitchGame>>('gameData', () => new Map<string, TwitchGame>())
if (gameData.value.has(props.clip.game_id)) {
  game.value = gameData.value.get(props.clip.game_id) as TwitchGame
  loadingGame.value = false
}

onMounted(async () => {
  if (!gameData.value.has(props.clip.game_id)) {
    try {
      const data = await $fetch <TwitchAPIResponse<TwitchGame>>(`/api/twitch/game/game`, { query: { id: props.clip.game_id } })
      if (data.data[0])
        game.value = data.data[0]
    }
    catch (error) {
      console.error('Failed to load game data', error)
    }
    finally {
      gameData.value.set(props.clip.game_id, game.value as TwitchGame)
      loadingGame.value = false
    }
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
