<template>
  <div class="flex flex-row items-center justify-between gap-4 bg-gray-100 px-2 py-4 shadow dark:bg-gray-900">
    <NuxtLink to="/" class="flex flex-row items-center gap-2 text-sm text-black hover:opacity-80 sm:text-xl dark:text-white">
      <UIcon name="fluent-emoji-flat:clapper-board" />Better Twitch Clips
    </NuxtLink>
    <div class="flex flex-row gap-2">
      <UISearch />
      <AuthState v-slot="{ loggedIn }">
        <div v-if="loggedIn">
          <UDropdown :items="items" :popper="{ placement: 'bottom-start' }">
            <UButton
              color="gray"
              variant="ghost"
              :label="session?.user?.login ?? ''"
              trailing-icon="i-heroicons-chevron-down-20-solid"
            >
              <template #leading>
                <UAvatar
                  :src="
                    session.user?.profile_image_url
                  "
                  :alt="session.user?.login"
                  size="2xs"
                />
              </template>
            </UButton>
          </UDropdown>
        </div>
        <a v-else href="/auth/twitch">
          <UButton icon="fa6-brands:twitch" color="purple">
            Login
          </UButton>
        </a>
      </AuthState>

      <UIDarkToggle />
    </div>
  </div>
</template>

<script setup lang="ts">
const { session, clear } = useUserSession()

const items = [
  [{
    label: session.value.user?.login ?? '',
    avatar: {
      src: session.value.user?.profile_image_url ?? '',
    },
    to: `/channel/${session.value.user?.login}`,
  }],
  [{
    label: 'Logout',
    icon: 'ic:outline-log-out',
    click: async () => {
      await clear()
    },
  }],
]
</script>
