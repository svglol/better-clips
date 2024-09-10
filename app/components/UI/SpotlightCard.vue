<template>
  <div
    id="spotlight"
    ref="containerRef"
    class="relative w-full transform-gpu overflow-hidden rounded-lg bg-white/10 p-4 shadow-lg before:absolute before:inset-0 before:bg-[radial-gradient(var(--spotlight-size)_circle_at_var(--x)_var(--y),var(--spotlight-color-stops))]"
    :class="{ '!p-px': removePadding }"
  >
    <div class="bg-base-100 absolute inset-px rounded-lg" />
    <div class="relative h-full">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { removePadding } = defineProps<{
  removePadding?: boolean
}>()
const containerRef = ref<HTMLCanvasElement | null>(null)
const mousePosition = useMousePosition()
const mouse = reactive<{ x: number, y: number }>({ x: 0, y: 0 })
const containerSize = reactive<{ w: number, h: number }>({ w: 0, h: 0 })
onMounted(() => {
  initContainer()
  window.addEventListener('resize', initContainer)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', initContainer)
})

watch(
  () => mousePosition.value,
  () => {
    onMouseMove()
  },
)

function initContainer() {
  if (containerRef.value) {
    containerSize.w = containerRef.value.offsetWidth
    containerSize.h = containerRef.value.offsetHeight
    containerRef.value.style.setProperty('--x', `${0}px`)
    containerRef.value.style.setProperty('--y', `${0}px`)
  }
}

function onMouseMove() {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const x = mousePosition.value.x - rect.left
    const y = mousePosition.value.y - rect.top
    mouse.x = x
    mouse.y = y
    containerRef.value.style.setProperty('--x', `${x}px`)
    containerRef.value.style.setProperty('--y', `${y}px`)
  }
}
</script>

<style scoped>
#spotlight {
  --spotlight-color-stops: rgb(var(--color-primary-800)), rgb(var(--color-primary-500)), transparent;
  --spotlight-size: 200px;
}
</style>
