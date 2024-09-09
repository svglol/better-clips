<template>
  <div class="flex min-h-screen flex-col gap-2">
    <Header />
    <div class="mx-auto grid w-full grow">
      <slot />
    </div>
  </div>
</template>
