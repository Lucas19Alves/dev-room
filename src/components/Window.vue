<template>
  <!-- Janela principal -->
  <div
    v-show="!minimized"
    ref="windowRef"
    class="absolute shadow-2xl rounded-lg flex flex-col window"
    :style="{
      left: pos.x + 'px',
      top: pos.y + 'px',
      zIndex,
      width: size.width + 'px',
      height: size.height + 'px',
      background: 'var(--bg-panel)',
      border: '1px solid var(--glass-border)'
    }"
    @pointerdown="bringToFront"
    :id="`window-${title?.toLowerCase()?.replace(/\s/g, '-') || 'generic'}`"
  >
    <!-- Barra superior da janela (header) -->
    <div
      class="flex justify-between items-center rounded-t cursor-move select-none px-2 py-1 flex-shrink-0 window-header"
      data-drag-handle
      :style="{
        background: 'var(--window-header)',
        color: 'var(--text-main)'
      }"
      id="window-header"
    >
      <span class="font-semibold window-title text-sm" id="window-title">{{ title }}</span>
      <div class="flex items-center gap-0.5 ml-2 window-actions" id="window-actions">
        <!-- Botão minimizar -->
        <button
          @click="$emit('minimize')"
          class="window-btn window-btn-minimize"
          :title="'Minimizar'"
          id="window-btn-minimize"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <rect x="4" y="10" width="12" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
        <!-- Botão maximizar -->
        <button
          v-if="!maximized"
          @click="maximize"
          class="window-btn window-btn-maximize"
          :title="'Maximizar'"
          id="window-btn-maximize"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
        <!-- Botão restaurar -->
        <button
          v-else
          @click="restore"
          class="window-btn window-btn-restore"
          :title="'Restaurar'"
          id="window-btn-restore"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
            <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>
        <!-- Botão fechar -->
        <button
          @click="$emit('close')"
          class="window-btn window-btn-close"
          :title="'Fechar'"
          id="window-btn-close"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <line x1="6" y1="6" x2="14" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="14" y1="6" x2="6" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Conteúdo da janela -->
    <div class="flex-1 min-h-0 min-w-0 w-full overflow-auto window-content" :style="{ color: 'var(--text-main)' }" id="window-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
let windowInteractable = null

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

  windowInteractable = interact(windowRef.value)
  windowInteractable
    .draggable({
      allowFrom: '[data-drag-handle]',
      ignoreFrom: '.window-actions',
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
      // Remove resize pelo topo para não atrapalhar o drag
      edges: { left: true, right: true, bottom: true, top: false },
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

onUnmounted(() => {
  windowInteractable?.unset()
})
</script>

<style scoped>
.window-header {
  min-height: 38px;
  position: relative;
  justify-content: center !important;
  padding: 0.4rem 0.75rem !important;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.window-title {
  max-width: calc(100% - 8rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.window-actions {
  position: absolute;
  left: 0.8rem;
  gap: 0.45rem;
}
.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.82rem;
  height: 0.82rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  color: rgba(20, 20, 20, 0.62);
  outline: none;
  cursor: pointer;
  padding: 0;
}
.window-btn svg {
  display: block;
  width: 0.62rem;
  height: 0.62rem;
  opacity: 0;
  transition: opacity 120ms ease;
}
.window-btn-close { order: 1; background: var(--window-btn-close); }
.window-btn-minimize { order: 2; background: var(--window-btn-minimize); }
.window-btn-maximize,
.window-btn-restore { order: 3; background: var(--window-btn-maximize); }

.window-actions:hover .window-btn svg {
  opacity: 0.75;
}

.window-btn:hover {
  filter: brightness(1.08);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.16);
}
.window-btn-close:hover {
  background: var(--window-btn-close);
}
.window-btn-maximize:hover {
  background: var(--window-btn-maximize);
}
.window-btn-minimize:hover {
  background: var(--window-btn-minimize);
}
.window-btn-restore:hover {
  background: var(--window-btn-maximize);
}
</style>
