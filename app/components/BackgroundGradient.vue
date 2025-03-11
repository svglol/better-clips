<template>
  <div class="bg top-18 absolute inset-y-0 right-0 size-full transform-gpu overflow-hidden blur-[100px] transition-all duration-1000 ease-in-out" aria-hidden="true" :style="{ height: `${height}px !important` }">
    <div
      :style="{ height: `${height}px !important`, clipPath: primaryClipPath }"
      class="bg-primary-500 absolute left-[calc(-10%)] top-0 size-[200%] h-full opacity-100 transition-all duration-1000 ease-in-out"
    />
    <div
      :style="{ height: `${height}px !important`, clipPath: secondaryClipPath }"
      class="bg-primary-800 absolute left-[calc(-50%)] top-0 size-full h-full opacity-100 transition-all duration-1000 ease-in-out"
    />
  </div>
</template>

<script setup lang="ts">
const height = ref(0)
const rotation = ref(0)
const animationFrameId: number | null = null

const basePoints = [
  { x: 53.483, y: -112.997 },
  { x: 54.405, y: -18.459 },
  { x: 68.639, y: -107.187 },
  { x: 56.149, y: -17.084 },
  { x: 82.152, y: -90.386 },
  { x: 57.604, y: -14.482 },
  { x: 92.559, y: -64.416 },
  { x: 58.613, y: -10.936 },
  { x: 98.731, y: -32.09 },
  { x: 59.065, y: -6.83 },
  { x: 100, y: 3.088 },
  { x: 58.913, y: -2.608 },
  { x: 96.228, y: 37.307 },
  { x: 58.172, y: 1.271 },
  { x: 87.823, y: 66.858 },
  { x: 56.924, y: 4.387 },
  { x: 75.699, y: 88.538 },
  { x: 55.302, y: 6.403 },
  { x: 61.166, y: 100 },
  { x: 53.483, y: 7.1 },
  { x: 45.801, y: 100 },
  { x: 51.665, y: 6.403 },
  { x: 31.268, y: 88.538 },
  { x: 50.043, y: 4.387 },
  { x: 19.143, y: 66.858 },
  { x: 48.794, y: 1.271 },
  { x: 10.739, y: 37.307 },
  { x: 48.054, y: -2.608 },
  { x: 6.967, y: 3.088 },
  { x: 47.902, y: -6.83 },
  { x: 8.236, y: -32.09 },
  { x: 48.354, y: -10.936 },
  { x: 14.408, y: -64.416 },
  { x: 49.363, y: -14.482 },
  { x: 24.815, y: -90.386 },
  { x: 50.818, y: -17.084 },
  { x: 38.328, y: -107.187 },
  { x: 52.562, y: -18.459 },
  { x: 53.483, y: -112.997 },
]

function rotatePoint(point: { x: number, y: number }, angleDeg: number) {
  const centerX = 50
  const centerY = 0
  const angleRad = angleDeg * Math.PI / 180

  const translatedX = point.x - centerX
  const translatedY = point.y - centerY

  const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad)
  const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad)

  return {
    x: rotatedX + centerX,
    y: rotatedY + centerY,
  }
}

const primaryClipPath = computed(() => {
  const rotatedPoints = basePoints.map(point => rotatePoint(point, rotation.value))
  return `polygon(${rotatedPoints.map(p => `${p.x}% ${p.y}%`).join(',')})`
})

const secondaryClipPath = computed(() => {
  const rotatedPoints = basePoints.map(point => rotatePoint(point, -rotation.value * 0.7))
  return `polygon(${rotatedPoints.map(p => `${p.x}% ${p.y}%`).join(',')})`
})

let direction = 1

function animate() {
  rotation.value += 0.01 * direction
  if (rotation.value >= 10 || rotation.value <= -10) {
    direction *= -1
  }
  rotation.value = rotation.value % 360
  requestAnimationFrame(animate)
}

onMounted(() => {
  height.value = document.documentElement.scrollHeight - 123
  animate()
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.bg > div {
  transition: clip-path 1s;
}
</style>
