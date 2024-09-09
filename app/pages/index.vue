<template>
  <div class="flex flex-col gap-6 p-4">
    <div v-if="loggedIn" class="flex flex-col gap-6">
      <!-- Top Clips Section can be added here if needed -->
      <div v-if="data?.length ?? 0 > 0" class="flex flex-col gap-2">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Followed Channels
        </h2>
        <div class="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12">
          <div v-for="channel in data" :key="channel.id">
            <TwitchFavouriteChannel :channel="channel" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center gap-6 py-24">
      <span class="text-center text-lg font-semibold text-gray-900 dark:text-gray-200">
        For the best experience, please log in with your Twitch account
      </span>
      <a href="/auth/twitch">
        <UButton icon="fa6-brands:twitch" color="purple" size="lg" class="px-8 py-4">
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
