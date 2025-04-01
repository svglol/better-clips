<template>
  <div
    ref="el"
    class="card bg-(--ui-bg-elevated) relative rounded-lg p-0.5 shadow-lg"
    :style="{
      '--x': `${x - (el?.offsetLeft ?? 0)}px`,
      '--y': `${y - (el?.offsetTop ?? 0)}px`,
    }"
  >
    <div class="relative size-full">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { x, y } = useMouse()
const el = useTemplateRef('el')
</script>

<style scoped>
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  background: radial-gradient(
    var(--spotlight-size, 200px) circle at var(--x) var(--y),
    var(--spotlight-color-stops, var(--ui-color-primary-800), var(--ui-color-primary-500), transparent)
  );

  /* @apply rounded-lg; */
}
</style>
