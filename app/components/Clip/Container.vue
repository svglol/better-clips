<template>
  <div ref="clipsContainer" class="py-2">
    <ClientOnly>
      <DynamicScroller
        :items="chunkedClips"
        page-mode
        :min-item-size="200"
        :buffer="1000"
        @scroll-end="$emit('scrollEnd')"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :data-index="index"
          >
            <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))` }">
              <TwitchClipPreview v-for="clip in item.items" :key="clip.id" :clip="clip" @open-clip="openClip" />
            </div>
          </DynamicScrollerItem>
        </template>
        <template #after>
          <UILoading v-if="status === 'pending'" />
          <div v-else-if="clips.length === 0" class="py-auto my-auto flex size-full flex-col items-center justify-center">
            <UIcon name="mdi:robot-confused" class="text-primary-500 dark:text-primary-400 text-9xl" />
            <span class="text-2xl text-gray-500 dark:text-gray-400">No clips found!</span>
          </div>
        </template>
      </DynamicScroller>
    </ClientOnly>
  </div>

  <transition name="fade">
    <UButton v-show="showScrollToTop" icon="mdi:arrow-up" color="primary" class="fixed bottom-4 right-4 z-50 transition-colors duration-300" aria-label="Scroll to top" size="xl" @click="scrollToTop" />
  </transition>
</template>

<script lang="ts" setup>
import { breakpointsTailwind } from '@vueuse/core'
import ModalClip from '~/components/Modal/Clip.vue'

const props = defineProps({
  instanceId: {
    type: String,
    required: true,
    default: '',
  },
})

defineEmits<{
  (e: 'scrollEnd'): void
}>()
const router = useRouter()
const route = useRoute('channel-name')

const clips = defineModel<TwitchClip[]>('clips', { required: true, default: [] })
const status = defineModel<string>('status', { required: true, default: 'pending' })
const title = defineModel<string>('title', { default: '' })
const clipsContainer = ref<HTMLElement>()

const breakpoints = useBreakpoints(breakpointsTailwind)
const activeBreakpoint = breakpoints.active()
const itemsPerRow = computed(() => {
  switch (activeBreakpoint.value) {
    case 'sm':
      return 2
    case 'md':
      return 3
    case 'lg':
      return 4
    case 'xl':
      return 5
    case '2xl':
      return 6
    default: return 1
  }
})
const modal = useModal()

const isActiveInstance = computed(() => {
  return route.query.source === props.instanceId
})

watch(() => route.query, (newQuery, oldQuery) => {
  if (!isActiveInstance.value)
    return

  if (!route.query.clip) {
    modal.close()
  }
  else if (newQuery.clip !== oldQuery.clip) {
    openModal()
  }
})

function openClip(id: string) {
  const query = { ...route.query, clip: id, source: props.instanceId }
  router.push({ query })
}

function openModal() {
  if (!isActiveInstance.value)
    return

  modal.open(ModalClip, {
    id: String(route.query.clip),
    clip: clips.value.find(clip => clip.id === String(route.query.clip)),
    onClose: () => {
      if (window.history.length > 1 && window.history.state.back) {
        router.back()
      }
      else {
        router.push({ query: { ...route.query, clip: undefined } })
      }
      useSeoMeta({
        title: title.value,
      })
    },
  })
}

onMounted(() => {
  if (route.query.clip && isActiveInstance.value) {
    openModal()
  }
})

const chunkedClips = computed(() => {
  const clipsArray = clips.value.map((clip, index) => ({
    index,
    ...clip,
  })) ?? []
  return chunkArray(clipsArray, itemsPerRow.value)
})

function chunkArray(array: any[], size: number) {
  const result: { id: number, items: any[] }[] = []
  for (let i = 0; i < array.length; i += size) {
    result.push({
      id: Math.floor(i / size),
      items: array.slice(i, i + size),
    })
  }
  return result
}
const { y: scrollY } = useWindowScroll()
const showScrollToTop = computed(() => scrollY.value > 200)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

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
  const clipUrls = clips.value.map(clip => clip.thumbnail_url)
  Promise.all(clipUrls.map(url => preloadImage(url)))
}

watchDeep(clips, () => {
  preloadAllImages()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
