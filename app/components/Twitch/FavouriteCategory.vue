<template>
  <NuxtLink :to="`/category/${id}`" class="flex w-full max-w-56 flex-col items-center gap-4 rounded bg-gray-100 p-2 shadow transition-all hover:scale-[97%] hover:opacity-80 dark:bg-gray-900">
    <img :src="boxArt">
    <span class="aspect-[9:16] text-lg text-gray-800 dark:text-gray-200">{{ category?.name }}</span>
  </NuxtLink>
</template>

<script lang="ts" setup>
const props = defineProps<{
  id: string
}>()

const loading = ref(true)
const category = ref<TwitchCategory | null>(null)
const boxArt = computed(() => category.value?.box_art_url.replace('{width}', '144').replace('{height}', '192'))
onMounted(async () => {
  try {
    const data = await $fetch<TwitchAPIResponse<TwitchCategory>>(`/api/twitch/game/game`, { query: { id: props.id } })
    if (data.data[0])
      category.value = data.data[0]
  }
  catch (error) {
    console.error('Failed to load channel data', error)
  }
  finally {
    loading.value = false
  }
})
</script>
