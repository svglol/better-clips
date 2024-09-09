<template>
  <div class="flex flex-row rounded-md border border-gray-300 shadow-sm md:w-96 dark:border-gray-700">
    <UInput v-model="searchQuery" placeholder="Search" :ui="{ rounded: 'rounded-l-md rounded-r-none' }" class="flex-1" :size="size" variant="none" @keydown.enter="search">
      <template #leading>
        <UIcon name="i-heroicons-magnifying-glass-20-solid" />
      </template>
    </UInput>
    <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']">
      <UButton
        :ui="{ rounded: 'rounded-r-md rounded-l-none' }"
        icon="i-heroicons-magnifying-glass-20-solid"
        variant="soft"
        aria-label="Search"
        :size="size"
        color="primary"
        @click="search"
      />
    </UTooltip>
  </div>
  <UModal v-model="isOpen">
    <UCommandPalette
      ref="commandPalette"
      :autoselect="false"
      :groups="groups"
      selected-icon=""
      @update:model-value="onSelect"
    >
      <template #empty-state>
        <div />
      </template>
    </UCommandPalette>
  </UModal>
</template>

<script lang="ts" setup>
import { breakpointsTailwind } from '@vueuse/core'

const { metaSymbol } = useShortcuts()
const { disableShortcut } = definePropsRefs<{
  disableShortcut?: boolean
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const commandPalette = ref()
const route = useRoute()

watch(() => route.path, () => {
  searchQuery.value = ''
})

watch(isOpen, () => {
  if (!isOpen.value) {
    searchQuery.value = ''
  }
})

const groups = [
  {
    key: 'channels',
    label: (q: string) => q && `Channels matching “${q}”...`,
    search: async (q: string) => {
      if (!q)
        return []
      const pages = (await $fetch<TwitchAPIResponse<TwitchChannel>>('/api/twitch/channels/search', { params: { query: q } }))
      return pages.data.sort((a, b) => a.is_live === b.is_live ? 0 : a.is_live ? -1 : 1).map(page => ({
        id: page.id,
        to: `/channel/${page.display_name}`,
        label: page.display_name,
        avatar: { src: page.thumbnail_url, size: 'sm', loading: 'lazy' },
      }))
    },
  },
  {
    key: 'categories',
    label: (q: string) => q && `Categories matching “${q}”...`,
    search: async (q: string) => {
      if (!q)
        return []

      const pages = (await $fetch<TwitchAPIResponse<TwitchCategory>>('/api/twitch/game/search', { params: { query: q } }))
      return pages.data.map(page => ({
        id: page.id,
        to: `/category/${page.id}`,
        label: page.name,
        avatar: { src: page.box_art_url, size: 'sm', loading: 'lazy' },
      }))
    },
  },
]

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      if (disableShortcut.value)
        return
      isOpen.value = !isOpen.value
      nextTick(() => {
        commandPalette.value.updateQuery(searchQuery.value)
      })
    },
  },
  escape: {
    usingInput: true,
    whenever: [isOpen],
    handler: () => {
      if (disableShortcut.value)
        return
      isOpen.value = false
    },
  },
})

const router = useRouter()
function onSelect(option: any) {
  isOpen.value = false
  if (option.click) {
    option.click()
  }
  else if (option.to) {
    router.push(option.to)
  }
  else if (option.href) {
    window.open(option.href, '_blank')
  }
}

function search() {
  isOpen.value = true
  nextTick(() => {
    commandPalette.value.updateQuery(searchQuery.value)
  })
}

const breakpoints = useBreakpoints(breakpointsTailwind)
const activeBreakpoint = breakpoints.active()
const size = computed(() => {
  switch (activeBreakpoint.value) {
    case 'sm':
      return 'md'
    case 'md':
      return 'xl'
    case 'lg':
      return 'xl'
    case 'xl':
      return 'xl'
    case '2xl':
      return 'xl'
    default: return 'md'
  }
})
</script>
