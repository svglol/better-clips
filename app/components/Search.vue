<template>
  <div class="flex flex-col gap-2 max-w-7xl mx-auto py-4">
    <UCommandPalette
      v-model:search-term="searchQuery"
      class="border border-(--ui-border-accented) rounded-md shadow-sm"
      :loading="status === 'pending'"
      :groups="groups"
      placeholder="Search for a channel or game"
    >
      <template #empty>
        <div />
      </template>
    </UCommandPalette>
  </div>
</template>

<script lang="ts" setup>
const searchQuery = ref('')
const visitedPagesStore = useVisitedPagesStore()
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

const recentPages = ref<VisitedPage[]>([])

onMounted(() => {
  recentPages.value = visitedPagesStore.recentPages
})

const groups = computed(() => [
  {
    id: 'history',
    label: 'Recently visited',
    items: recentPages.value.filter(page => page.title?.toLowerCase()?.includes(searchQuery.value)).map(page => ({
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
</script>
