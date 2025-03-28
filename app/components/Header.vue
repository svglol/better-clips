<template>
  <div class="bg-(--ui-bg-elevated)/50 z-10 flex flex-row items-center justify-between gap-4 px-2 py-4 shadow ">
    <NuxtLink to="/" class="text-(--ui-text-highlighted) flex flex-row items-center gap-2 text-xl hover:opacity-80 ">
      <UIcon name="fluent-emoji-flat:clapper-board" /><span class="hidden sm:inline-block">Better Clips</span>
    </NuxtLink>
    <div>
      <UISearch />
    </div>
    <div class="flex flex-row gap-2">
      <AuthState v-slot="{ loggedIn }">
        <div v-if="loggedIn">
          <UDropdownMenu :items="items">
            <UButton
              color="neutral"
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
          </UDropdownMenu>
        </div>
        <UButton v-else icon="fa6-brands:twitch" color="primary" @click="login">
          Login
        </UButton>
      </AuthState>
    </div>
  </div>
</template>

<script setup lang="ts">
const { session, clear } = useUserSession()

const mode = useColorMode()
const route = useRoute()
const isDark = computed({
  get() {
    return mode.value === 'dark'
  },
  set() {
    mode.preference = mode.value === 'dark' ? 'light' : 'dark'
  },
})

function login() {
  const callbackUrl = useCookie('callbackUrl', { maxAge: 60 })
  callbackUrl.value = route.path
  window.location.href = '/auth/twitch'
}

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
        onSelect: (e: MouseEvent) => toggle(e),
      },
      {
        label: 'Logout',
        icon: 'ic:outline-log-out',
        onSelect: async () => {
          await clear()
        },
      },
    ],
  ]
})

const isAppearanceTransition
  = typeof document !== 'undefined'
    && typeof document.startViewTransition === 'function'
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
