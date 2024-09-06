<template>
  <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']">
    <UButton
      icon="i-heroicons-magnifying-glass-20-solid"
      color="gray"
      variant="ghost"
      aria-label="Search"
      @click="isOpen = true"
    />
  </UTooltip>
  <UModal v-model="isOpen">
    <UCommandPalette
      :autoselect="false"
      :groups="groups"
      selected-icon=""
      @update:model-value="onSelect"
    >
      <template #empty-state>
        <div />
      </template>
    </UCommandPalette>
  </UModal>
</template>

<script lang="ts" setup>
const { metaSymbol } = useShortcuts()
const { disableShortcut } = definePropsRefs<{
  disableShortcut?: boolean
}>()

const isOpen = ref(false)

const groups = [
  {
    key: 'channels',
    label: (q: string) => q && `Channels matching “${q}”...`,
    search: async (q: string) => {
      if (!q)
        return []
      const pages = (await $fetch<TwitchAPIResponse<TwitchChannel>>('/api/twitch/channels/search', { params: { query: q } }))
      return pages.data.sort((a, b) => a.is_live === b.is_live ? 0 : a.is_live ? -1 : 1).map(page => ({
        id: page.id,
        to: `/channel/${page.display_name}`,
        label: page.display_name,
        avatar: { src: page.thumbnail_url, size: 'sm', loading: 'lazy' },
      }))
    },
  },
  {
    key: 'categories',
    label: (q: string) => q && `Categories matching “${q}”...`,
    search: async (q: string) => {
      if (!q)
        return []

      const pages = (await $fetch<TwitchAPIResponse<TwitchCategory>>('/api/twitch/game/search', { params: { query: q } }))
      return pages.data.map(page => ({
        id: page.id,
        to: `/category/${page.id}`,
        label: page.name,
        avatar: { src: page.box_art_url, size: 'sm', loading: 'lazy' },
      }))
    },
  },
]

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      if (disableShortcut.value)
        return
      isOpen.value = !isOpen.value
    },
  },
  escape: {
    usingInput: true,
    whenever: [isOpen],
    handler: () => {
      if (disableShortcut.value)
        return
      isOpen.value = false
    },
  },
})

const router = useRouter()
function onSelect(option: any) {
  isOpen.value = false
  if (option.click) {
    option.click()
  }
  else if (option.to) {
    router.push(option.to)
  }
  else if (option.href) {
    window.open(option.href, '_blank')
  }
}
</script>
