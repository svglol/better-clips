<template>
  <div class="border-(--ui-border) flex flex-row rounded-md border shadow-sm md:w-96">
    <UPopover v-model:open="isOpen" :content="{ side: 'bottom', align: 'start', sideOffset: -35.5 }" :ui="{ content: 'data-[state=open]:!animate-[fade-in_100ms_ease-out] data-[state=closed]:!animate-[fade-out_100ms_ease-in]' }">
      <UButtonGroup class="w-full">
        <UInput placeholder="Search" class="flex-1" variant="none" size="lg" @keydown.enter="search">
          <template #leading>
            <UIcon name="i-heroicons-magnifying-glass-20-solid" class="text-(--ui-text-dimmed) size-5" />
          </template>
        </UInput>
        <UButton
          icon="i-heroicons-magnifying-glass-20-solid"
          variant="soft"
          aria-label="Search"
          color="primary"
        />
      </UButtonGroup>
      <template #content>
        <UCommandPalette
          v-model:search-term="searchQuery"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search"
          :loading="status === 'pending'"
          :groups="groups"
          class="md:w-96 w-full"
          :ui="{ input: '[&>input]:h-[2.2rem] [&>span]:pe-0 bg-(--ui-bg-elevated)/50', root: 'w-full' }"
          :close="{
            color: 'primary',
            variant: 'soft',
            class: 'rounded-b-none rounded-tl-none h-[2.2rem]',
          }"
          @update:model-value="onSelect"
        />
      </template>
    </UPopover>
  </div>
</template>

<script lang="ts" setup>
const { disableShortcut } = definePropsRefs<{
  disableShortcut?: boolean
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const route = useRoute()

watch(() => route.path, () => {
  searchQuery.value = ''
})

watch(isOpen, () => {
  if (!isOpen.value) {
    searchQuery.value = ''
  }
})

const debouncedSearch = debouncedRef(searchQuery, 300)
const { data, status } = await useAsyncData('search', async () => {
  if (debouncedSearch.value === '') {
    return {
      channels: { data: [] },
      categories: { data: [] },
    }
  }
  const [channels, categories] = await Promise.all([
    $fetch<TwitchAPIResponse<TwitchChannel>>('/api/twitch/channels/search', { params: { query: debouncedSearch.value } }),
    $fetch<TwitchAPIResponse<TwitchCategory>>('/api/twitch/game/search', { params: { query: debouncedSearch.value } }),
  ])
  return {
    channels,
    categories,
  }
}, {
  watch: [debouncedSearch],
  lazy: true,
  immediate: false,
  server: false,
})

const visitedPagesStore = useVisitedPagesStore()

const groups = computed(() => [
  {
    id: 'history',
    label: 'Recently visited',
    items: visitedPagesStore.recentPages.filter(page => page.title?.toLowerCase()?.includes(searchQuery.value)).map(page => ({
      id: page.path,
      label: page.title,
      to: page.path,
      avatar: { src: page.img },
    })),
  },
  {
    id: 'users',
    label: searchQuery.value ? `Channels matching “${searchQuery.value}”...` : 'Channels',
    items: data.value?.channels.data.map(channel => ({
      id: channel.id,
      label: channel.display_name,
      to: `/channel/${channel.display_name}`,
      avatar: { src: channel.thumbnail_url },
    })),
  },
  {
    id: 'categories',
    label: searchQuery.value ? `Categories matching “${searchQuery.value}”...` : 'Categories',
    ignoreFilter: true,
    items: data.value?.categories.data.map(category => ({
      id: category.id,
      label: category.name,
      to: `/category/${category.id}`,
      avatar: { src: category.box_art_url },
    })),
  },
])

defineShortcuts({
  meta_k: () => {
    if (disableShortcut.value)
      return
    isOpen.value = !isOpen.value
  },
  escape: () => {
    if (disableShortcut.value)
      return
    isOpen.value = false
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
}
</script>
