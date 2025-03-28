<template>
  <div class="flex flex-col gap-2">
    <template v-if="status === 'pending'">
      <div class="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12">
        <TwitchFavouriteChannelSkeleton v-for="i in 24" :key="i" />
      </div>
    </template>
    <template v-else-if="data && data.length > 0">
      <div class="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12">
        <TwitchFavouriteChannel v-for="channel in data" :key="channel.id" :channel="channel" />
      </div>
    </template>
    <template v-else>
      <div>
        No followed channels found.
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const loaded = ref(false)
const isActive = computed(() => {
  return route.query.tab === 'followed-channels'
})

const { data, status, execute } = useFetch<TwitchUser[]>('/api/twitch/user/followed', { server: false, immediate: false, lazy: true })

watch(isActive, (active) => {
  if (active && !loaded.value) {
    loaded.value = true
    execute()
  }
}, { immediate: true })
</script>
