<template>
  <div class="flex flex-col gap-4 p-2">
    <div>
      <UInput v-model="searchQuery" placeholder="Search for channels or categories" size="xl" @keydown.enter="search">
        <template #leading>
          <UIcon name="i-heroicons-magnifying-glass-20-solid" />
        </template>
      </UInput>
    </div>
    <div v-if="loggedIn" class="flex flex-col gap-4">
      <!-- <div class="flex flex-col gap-4">
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300">
          Top Clips Today
        </h2> <span>   top 20 clips from last 24 hours on your followed channels</span>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-2 2xl:grid-cols-3" />
      </div> -->
      <div v-if="data?.length ?? 0 > 0" class="flex flex-col gap-4">
        <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300">
          Followed Channels
        </h2>
        <div class="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12">
          <div v-for="channel in data" :key="channel.id">
            <TwitchFavouriteChannel :channel="channel" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="mx-auto flex flex-col items-center justify-center gap-4 py-24">
      <span class="font-semibold text-gray-800 dark:text-gray-200">For the best experience, please login with your twitch account</span>
      <a href="/auth/twitch">
        <UButton icon="fa6-brands:twitch" color="purple" size="lg">
          Login with Twitch
        </UButton>
      </a>
    </div>
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

<script setup lang="ts">
const { loggedIn } = useUserSession()

useSeoMeta({
  title: '',
})

const { data } = await useFetch<TwitchUser[]>('/api/twitch/user/followed')

const searchQuery = ref('')

const isOpen = ref(false)
const commandPalette = ref()

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
</script>
