<template>
  <div
    v-show="!minimized"
    ref="windowRef"
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
          v-if="!maximized"
          @click="maximize"
          class="text-green-400 hover:text-green-600 text-xl font-bold"
          style="background: transparent;"
          title="Maximizar"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="4" y="4" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"/></svg>
        </button>
        <button
          v-else
          @click="restore"
          class="text-blue-400 hover:text-blue-600 text-xl font-bold"
          style="background: transparent;"
          title="Restaurar"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="6" y="6" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none"/><rect x="4" y="4" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none"/></svg>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import interact from 'interactjs'

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
const windowRef = ref(null)

const minWidth = 280
const minHeight = 160

const maximized = ref(false)
const prevState = ref({ x: 0, y: 0, width: 0, height: 0 })

watch(() => props.x, val => (pos.value.x = val))
watch(() => props.y, val => (pos.value.y = val))

function bringToFront() {
  emit('bringToFront')
}

function maximize() {
  prevState.value = {
    x: pos.value.x,
    y: pos.value.y,
    width: size.value.width,
    height: size.value.height
  }
  let container = props.containerSelector
    ? document.querySelector(props.containerSelector)
    : windowRef.value.parentElement
  if (container) {
    const rect = container.getBoundingClientRect()
    pos.value.x = 0
    pos.value.y = 0
    size.value.width = rect.width
    size.value.height = rect.height
    maximized.value = true
    emit('update:position', { x: pos.value.x, y: pos.value.y })
    emit('update:size', { width: size.value.width, height: size.value.height })
  }
}

function restore() {
  pos.value.x = prevState.value.x
  pos.value.y = prevState.value.y
  size.value.width = prevState.value.width
  size.value.height = prevState.value.height
  maximized.value = false
  emit('update:position', { x: pos.value.x, y: pos.value.y })
  emit('update:size', { width: size.value.width, height: size.value.height })
}

onMounted(() => {
  size.value.width = props.width
  size.value.height = props.height

  interact(windowRef.value)
    .draggable({
      allowFrom: '.cursor-move',
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: props.containerSelector
            ? document.querySelector(props.containerSelector)
            : 'parent',
          endOnly: true
        })
      ],
      listeners: {
        move(event) {
          if (!maximized.value) {
            pos.value.x += event.dx
            pos.value.y += event.dy
            emit('update:position', { x: pos.value.x, y: pos.value.y })
          }
        }
      }
    })
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      modifiers: [
        interact.modifiers.restrictEdges({
          outer: props.containerSelector
            ? document.querySelector(props.containerSelector)
            : 'parent'
        }),
        interact.modifiers.restrictSize({
          min: { width: minWidth, height: minHeight }
        })
      ],
      listeners: {
        move(event) {
          if (!maximized.value) {
            size.value.width = event.rect.width
            size.value.height = event.rect.height
            pos.value.x += event.deltaRect.left
            pos.value.y += event.deltaRect.top
            emit('update:position', { x: pos.value.x, y: pos.value.y })
            emit('update:size', { width: size.value.width, height: size.value.height })
          }
        }
      }
    })
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