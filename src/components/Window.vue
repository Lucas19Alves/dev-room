<template>
  <div
    v-show="!minimized"
    class="absolute shadow-2xl rounded-lg flex flex-col"
    :style="{
      left: pos.x + 'px',
      top: pos.y + 'px',
      zIndex,
      width: size.width + 'px',
      height: size.height + 'px',
      background: 'var(--bg-panel)',
      border: '2px solid var(--accent)'
    }"
    @mousedown.self="bringToFront"
  >

    <div
      class="flex justify-between items-center rounded-t cursor-move select-none px-4 py-2 flex-shrink-0"
      :style="{
        background: 'var(--accent)',
        color: 'var(--text-main)'
      }"
      @mousedown.stop.prevent="startDrag"
    >
      <span class="font-semibold">{{ title }}</span>
      <div class="flex items-center gap-1 ml-2">
        <button
          @click="$emit('minimize')"
          class="text-yellow-400 hover:text-yellow-600 text-xl font-bold"
          style="background: transparent;"
          title="Minimizar"
        >
          &minus;
        </button>
        <button
          @click="$emit('close')"
          class="text-red-400 hover:text-red-600 text-xl font-bold"
          style="background: transparent;"
          title="Fechar"
        >&times;</button>
      </div>
    </div>

    <div class="flex-1 w-full overflow-auto" :style="{ color: 'var(--text-main)' }">
      <slot />
    </div>

    <div
      v-for="dir in directions"
      :key="dir"
      :class="['resize-handle', dir]"
      @mousedown.stop.prevent="(e) => startResize(dir, e)"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  title: String,
  x: Number,
  y: Number,
  zIndex: Number,
  width: { type: Number, default: 400 },
  height: { type: Number, default: 300 },
  containerSelector: { type: String, default: null },
  minimized: { type: Boolean, default: false }
})
const emit = defineEmits(['update:position', 'bringToFront', 'close', 'update:size', 'minimize'])

const pos = ref({ x: props.x, y: props.y })
const size = ref({ width: props.width, height: props.height })

watch(() => props.x, val => (pos.value.x = val))
watch(() => props.y, val => (pos.value.y = val))

const dragging = ref(false)
const resizing = ref(false)
const resizeDir = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const resizeOffset = ref({ x: 0, y: 0 })
const minWidth = 260
const minHeight = 120

const directions = [
  'right', 'bottom', 'corner', 'left', 'top', 'top-left', 'top-right', 'bottom-left'
]

function bringToFront() {
  emit('bringToFront')
}

function startDrag(e) {
  dragging.value = true
  dragOffset.value = {
    x: e.clientX - pos.value.x,
    y: e.clientY - pos.value.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  bringToFront()
}

function onDrag(e) {
  if (!dragging.value) return

  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y

  if (props.containerSelector) {
    const container = document.querySelector(props.containerSelector)
    if (container) {
      const rect = container.getBoundingClientRect()
      newX = Math.max(0, Math.min(newX, rect.width - size.value.width))
      newY = Math.max(0, Math.min(newY, rect.height - size.value.height))
    }
  }

  pos.value.x = newX
  pos.value.y = newY
  emit('update:position', { x: pos.value.x, y: pos.value.y })
}

function stopDrag() {
  dragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function startResize(dir, e) {
  resizing.value = true
  resizeDir.value = dir
  resizeOffset.value = {
    x: e.clientX,
    y: e.clientY,
    origX: pos.value.x,
    origY: pos.value.y,
    origWidth: size.value.width,
    origHeight: size.value.height
  }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  bringToFront()
}

function onResize(e) {
  if (!resizing.value) return

  let dx = e.clientX - resizeOffset.value.x
  let dy = e.clientY - resizeOffset.value.y

  let newX = pos.value.x
  let newY = pos.value.y
  let newWidth = size.value.width
  let newHeight = size.value.height

  switch (resizeDir.value) {
    case 'right':
      newWidth = Math.max(minWidth, resizeOffset.value.origWidth + dx)
      break
    case 'left':
      newWidth = Math.max(minWidth, resizeOffset.value.origWidth - dx)
      newX = resizeOffset.value.origX + dx
      break
    case 'bottom':
      newHeight = Math.max(minHeight, resizeOffset.value.origHeight + dy)
      break
    case 'top':
      newHeight = Math.max(minHeight, resizeOffset.value.origHeight - dy)
      newY = resizeOffset.value.origY + dy
      break
    case 'corner': // bottom-right
      newWidth = Math.max(minWidth, resizeOffset.value.origWidth + dx)
      newHeight = Math.max(minHeight, resizeOffset.value.origHeight + dy)
      break
    case 'top-left':
      newWidth = Math.max(minWidth, resizeOffset.value.origWidth - dx)
      newX = resizeOffset.value.origX + dx
      newHeight = Math.max(minHeight, resizeOffset.value.origHeight - dy)
      newY = resizeOffset.value.origY + dy
      break
    case 'top-right':
      newWidth = Math.max(minWidth, resizeOffset.value.origWidth + dx)
      newHeight = Math.max(minHeight, resizeOffset.value.origHeight - dy)
      newY = resizeOffset.value.origY + dy
      break
    case 'bottom-left':
      newWidth = Math.max(minWidth, resizeOffset.value.origWidth - dx)
      newX = resizeOffset.value.origX + dx
      newHeight = Math.max(minHeight, resizeOffset.value.origHeight + dy)
      break
  }

  pos.value.x = newX
  pos.value.y = newY
  size.value.width = newWidth
  size.value.height = newHeight

  emit('update:position', { x: pos.value.x, y: pos.value.y })
  emit('update:size', { width: size.value.width, height: size.value.height })
}

function stopResize() {
  resizing.value = false
  resizeDir.value = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  size.value.width = props.width
  size.value.height = props.height
})
</script>

<style scoped>
.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 10;
}
.resize-handle.right {
  top: 0; right: 0; width: 10px; height: 100%; cursor: ew-resize;
}
.resize-handle.left {
  top: 0; left: 0; width: 10px; height: 100%; cursor: ew-resize;
}
.resize-handle.bottom {
  left: 0; bottom: 0; width: 100%; height: 10px; cursor: ns-resize;
}
.resize-handle.top {
  left: 0; top: 0; width: 100%; height: 10px; cursor: ns-resize;
}
.resize-handle.corner, .resize-handle.bottom-right {
  right: 0; bottom: 0; width: 18px; height: 18px; cursor: nwse-resize;
}
.resize-handle.top-left {
  left: 0; top: 0; width: 18px; height: 18px; cursor: nwse-resize;
}
.resize-handle.top-right {
  right: 0; top: 0; width: 18px; height: 18px; cursor: nesw-resize;
}
.resize-handle.bottom-left {
  left: 0; bottom: 0; width: 18px; height: 18px; cursor: nesw-resize;
}
</style>