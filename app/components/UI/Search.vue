<template>
  <div class="border-(--ui-border-accented) flex flex-row rounded-md border shadow-sm md:w-96">
    <UInput v-model="searchQuery" placeholder="Search" :ui="{ base: 'rounded-l-md rounded-r-none' }" class="flex-1" variant="none" @keydown.enter="search">
      <template #leading>
        <UIcon name="i-heroicons-magnifying-glass-20-solid" />
      </template>
    </UInput>
    <!-- <UTooltip text="Search" :shortcuts="['meta', 'K']"> -->
    <UButton
      :ui="{ base: 'rounded-r-md rounded-l-none' }"
      icon="i-heroicons-magnifying-glass-20-solid"
      variant="soft"
      aria-label="Search"
      color="primary"
      @click="search"
    />
    <!-- </UTooltip> -->
  </div>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCommandPalette
        ref="commandPalette"
        v-model:search-term="searchQuery"
        :loading="status === 'pending'"
        :groups="groups"
        @update:model-value="onSelect"
      >
        <template #empty>
          <div />
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
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

const groups = computed(() => [
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
      to: `/category/${category.name}`,
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
