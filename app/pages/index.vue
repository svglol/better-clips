<template>
  <div class="flex flex-col gap-4 p-2">
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
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession()

useSeoMeta({
  title: '',
})

const { data } = await useFetch<TwitchUser[]>('/api/twitch/user/followed')
</script>
