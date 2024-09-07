<template>
  <div ref="clipsContainer">
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
          <div v-if="status === 'pending'" class="py-auto my-auto flex size-full items-center justify-center">
            <div class="border-primary-200 dark:border-primary-800 m-2 size-12 animate-spin rounded-full border-y-2 p-2" />
          </div>
          <div v-else-if="clips.length === 0" class="py-auto my-auto flex size-full flex-col items-center justify-center">
            <UIcon name="mdi:robot-confused" class="text-primary-500 dark:text-primary-400 text-9xl" />
            <span class="text-2xl text-gray-500 dark:text-gray-400">No clips found!</span>
          </div>
        </template>
      </DynamicScroller>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { breakpointsTailwind } from '@vueuse/core'
import { ModalClip } from '#components'

defineEmits<{
  (e: 'scrollEnd'): void
}>()
const router = useRouter()
const route = useRoute('channel-name')

const clips = defineModel<TwitchClip[]>('clips', { required: true, default: [] })
const status = defineModel<string>('status', { required: true, default: 'pending' })
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
function openClip(id: string) {
  const query = { ...route.query, clip: id }
  router.push({ query })

  modal.open(ModalClip, {
    id,
    onClose: () => {
      const { clip, ...remainingQuery } = route.query
      router.push({ query: remainingQuery })
    },
  })
}

onMounted(() => {
  if (route.query.clip) {
    openClip(String(route.query.clip))
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
</script>
