<template>
  <div class="flex flex-row items-center justify-between gap-4 bg-gray-100 px-2 py-4 shadow dark:bg-gray-900">
    <NuxtLink to="/" class="flex flex-row items-center gap-4 text-sm text-black hover:opacity-80 sm:text-xl dark:text-white">
      🎬 Better Twitch Clips
    </NuxtLink>
    <div class="flex flex-row gap-4">
      <UISearch />
      <UIDarkToggle />
      <UButton icon="mdi:github" variant="ghost" to="https://github.com/svglol" color="gray" target="_blank" />
    </div>
  </div>
</template>
