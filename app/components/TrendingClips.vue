<template>
  <div class="flex flex-col gap-2">
    <ClipContainer v-model:clips="clips" v-model:status="status" title="" instance-id="trending-clips" @scroll-end="onScrollEnd" />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const page = ref(1)
const loaded = ref(false)

const isActive = computed(() => {
  return !route.query.tab || route.query.tab === 'trending-clips'
})

const { data, status, execute } = useFetch<{
  clips: TwitchClip[]
  pagination: {
    currentPage: number
    totalPages: number
    totalClips: number
    limit: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}>('/api/twitch/trending-clips', {
  params: { page },
  lazy: true,
  server: false,
  immediate: false,
})

const clips = ref<TwitchClip[]>([])

watch(isActive, (active) => {
  if (active && !loaded.value) {
    loaded.value = true
    execute()
  }
}, { immediate: true })

const loadedImages = useState<string[]>('loadedImages', () => [])

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!loadedImages.value.includes(url)) {
      const img = new Image()
      img.src = url
      img.onload = () => {
        loadedImages.value.push(url)
        resolve()
      }
      img.onerror = () => resolve()
    }
    else {
      resolve()
    }
  })
}

function preloadAllImages() {
  if (data.value) {
    const clipUrls = clips.value.map(clip => clip.thumbnail_url)
    Promise.all(clipUrls.map(url => preloadImage(url)))
  }
}

watchDeep(clips, () => {
  preloadAllImages()
})

watch(data, () => {
  if (data.value && data.value.clips) {
    clips.value.push(...data.value.clips)
  }
  else {
    clips.value = []
  }
})

function onScrollEnd() {
  if (data.value?.pagination?.hasNextPage && data.value?.pagination?.currentPage < data.value?.pagination?.totalPages) {
    page.value++
  }
}
</script>
