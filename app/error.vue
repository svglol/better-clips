<template>
  <NuxtLayout name="default">
    <div class="flex size-full min-h-0 flex-col items-center justify-center py-8">
      <p class="text-primary text-base font-semibold">
        {{ error.statusCode }}
      </p>
      <h1
        class="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white"
      >
        {{ error.message }}
      </h1>
      <p class="mt-6 text-center text-base/7 text-gray-500 dark:text-gray-400">
        The page you are looking for does not exist.
      </p>
      <div class="mt-10 flex items-center justify-center gap-x-6">
        <UButton size="lg" @click="handleError">
          Go back home
        </UButton>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from 'nuxt/app'

const { error } = definePropsRefs<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })

useHead({
  title: 'Error',
})
</script>
