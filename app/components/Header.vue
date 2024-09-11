<template>
  <div class="flex flex-row items-center justify-between gap-4 bg-gray-100 px-2 py-4 shadow dark:bg-gray-900">
    <NuxtLink to="/" class="flex flex-row items-center gap-2 text-xl text-black hover:opacity-80 dark:text-white">
      <UIcon name="fluent-emoji-flat:clapper-board" /><span class="hidden sm:inline-block">Better Clips</span>
    </NuxtLink>
    <div>
      <UISearch />
    </div>
    <div class="flex flex-row gap-2">
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
    </div>
  </div>
</template>

<script setup lang="ts">
const { session, clear } = useUserSession()

const mode = useColorMode()
const isDark = computed({
  get() {
    return mode.value === 'dark'
  },
  set() {
    mode.preference = mode.value === 'dark' ? 'light' : 'dark'
  },
})

const items = computed(() => {
  return [
    [{
      label: session.value.user?.login ?? '',
      avatar: {
        src: session.value.user?.profile_image_url ?? '',
      },
      to: `/channel/${session.value.user?.login}`,
    }],
    [
      {
        label: isDark.value ? 'Light Mode' : 'Dark Mode',
        icon: isDark.value ? 'i-heroicons-moon' : 'i-heroicons-sun',
        click: (e: MouseEvent) => toggle(e),
      },
      {
        label: 'Logout',
        icon: 'ic:outline-log-out',
        click: async () => {
          await clear()
        },
      },
    ],
  ]
})

const isAppearanceTransition
  = typeof document !== 'undefined'
  && document.startViewTransition
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Credit to [@hooray](https://github.com/hooray)
 * @see https://github.com/vuejs/vitepress/pull/2347
 * @see https://github.com/nuxt/devtools/blob/main/packages/devtools-ui-kit/src/components/NDarkToggle.vue
 */
function toggle(event?: MouseEvent) {
  if (!isAppearanceTransition || !event) {
    isDark.value = !isDark.value
    return
  }

  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  )
  // @ts-expect-error: Transition API
  const transition = document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  })

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ]
    document.documentElement.animate(
      {
        clipPath: isDark.value ? [...clipPath].reverse() : clipPath,
      },
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: isDark.value
          ? '::view-transition-old(root)'
          : '::view-transition-new(root)',
      },
    )
  })
}
</script>
