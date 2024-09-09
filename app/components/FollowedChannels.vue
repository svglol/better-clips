<template>
  <div class="flex flex-col gap-2">
    <template v-if="status === 'pending' || status === 'idle'">
      <UILoading />
    </template>
    <template v-else-if="data && data.length > 0">
      <div class="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12">
        <div v-for="channel in data" :key="channel.id">
          <TwitchFavouriteChannel :channel="channel" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="col-span-full">
        No followed channels found.
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
const { data, status } = await useFetch<TwitchUser[]>('/api/twitch/user/followed')
</script>
