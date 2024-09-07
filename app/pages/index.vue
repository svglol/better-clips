<template>
  <div class="flex flex-col gap-4 p-2">
    <div class="flex flex-col items-center gap-2">
      <span class="text-xl text-gray-700 dark:text-gray-200">Favourite Streamers</span>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <TwitchFavouriteChannel v-for="channel in favoriteChannels" :key="channel" :name="channel" />
        <div v-if="favoriteChannels.length === 0" class="flex flex-col items-center justify-center gap-2">
          <UIcon name="mdi:robot-confused" class="text-primary-500 dark:text-primary-400 text-6xl" />
          <span class="text-gray-500 dark:text-gray-400">No favourite channels found!</span>
        </div>
      </div>
    </div>
    <div class="flex flex-col items-center gap-2">
      <span class="text-xl text-gray-700 dark:text-gray-200">Favourite Categories</span>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <TwitchFavouriteCategory v-for="channel in favoriteCategories" :id="channel" :key="channel" />
        <div v-if="favoriteCategories.length === 0" class="flex flex-col items-center justify-center gap-2">
          <UIcon name="mdi:robot-confused" class="text-primary-500 dark:text-primary-400 text-6xl" />
          <span class="text-gray-500 dark:text-gray-400">No favourite categories found!</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const favoriteChannels = ref<string[]>([])
const favoriteCategories = ref<string[]>([])

onMounted(() => {
  const storedFavorites = localStorage.getItem('favoriteChannels')
  if (storedFavorites) {
    favoriteChannels.value = JSON.parse(storedFavorites)
  }

  const storedFavoritesCategories = localStorage.getItem('favoriteCategories')
  if (storedFavoritesCategories) {
    favoriteCategories.value = JSON.parse(storedFavoritesCategories)
  }
})
useSeoMeta({
  title: '',
})
</script>
