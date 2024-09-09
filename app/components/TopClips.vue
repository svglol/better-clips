<template>
  <div class="flex flex-col gap-2">
    <template v-if="status === 'pending' || status === 'idle'">
      <UILoading />
    </template>
    <template v-else-if="data && data.length > 0">
      <div class="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        <TwitchClipPreview v-for="clip in data" :key="clip.id" :clip="clip" @open-clip="openClip" />
      </div>
    </template>
    <template v-else>
      <div>
        No clips found.
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ModalClip } from '#components'

const { data, status, execute } = await useLazyFetch<TwitchClip[]>('/api/twitch/user/topclips', { immediate: false })
onMounted(() => {
  execute()
})

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
    const clipUrls = data.value.map(clip => clip.thumbnail_url)
    Promise.all(clipUrls.map(url => preloadImage(url)))
  }
}

watchDeep(data, () => {
  preloadAllImages()
})

const router = useRouter()
const route = useRoute('index')
function openClip(id: string) {
  const query = { ...route.query, clip: id }
  router.push({ query })
}
const modal = useModal()

watch(() => route.query, () => {
  if (!route.query.clip) {
    modal.close()
  }
  else {
    openModal()
  }
})

function openModal() {
  modal.open(ModalClip, {
    id: String(route.query.clip),
    clip: data.value?.find(clip => clip.id === String(route.query.clip)) ?? undefined,
    onClose: () => {
      router.back()
      useSeoMeta({
        title: '',
      })
    },
  })
}

onMounted(() => {
  if (route.query.clip) {
    openModal()
  }
})
</script>
