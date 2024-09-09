<template>
  <div class="flex flex-col gap-6 p-2 py-0">
    <div v-if="loggedIn" class="flex flex-col gap-6">
      <UHorizontalNavigation :links="links" class="border-b border-gray-200 dark:border-gray-800" :ui="{ base: '!text-md md:text-lg' }" />
      <UTabs
        v-model="selected"
        :items="tabs"
        :default-index="0"
        :ui="{
          wrapper: 'space-y-0',
          list: {
            base: 'hidden',
          },
        }"
        class="w-full"
      >
        <template #top-clips>
          <TopClips />
        </template>
        <template #followed-channels>
          <FollowedChannels />
        </template>
      </UTabs>
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

const route = useRoute()
const router = useRouter()

const tabs = ref([
  {
    slot: 'top-clips',
    id: 'top-clips',
    label: 'Trending Clips',
  },
  {
    slot: 'followed-channels',
    id: 'followed-channels',
    label: 'Followed Channels',
  },
])

const selected = computed({
  get() {
    const index = tabs.value.findIndex(item => item.id === route.query.tab)
    if (index === -1)
      return 0

    return index
  },
  set(value) {
    if (tabs.value[value]) {
      if (value === 0) {
        router.replace({
          query: { },
          hash: '',
        })
      }
      else {
        router.replace({
          query: { tab: tabs.value[value].id },
          hash: '',
        })
      }
    }
  },
})

const links = computed(() => {
  return tabs.value.map((tab, index) => ({
    ...tab,
    active: selected.value === index,
    click: () => selected.value = index,
  }))
})
</script>
