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
      border: '2px solid var(--accent)'
    }"
    @mousedown.self="bringToFront"
    :id="`window-${title?.toLowerCase()?.replace(/\s/g, '-') || 'generic'}`"
  >
    <!-- Barra superior da janela (header) -->
    <div
      class="flex justify-between items-center rounded-t cursor-move select-none px-2 py-1 flex-shrink-0 window-header"
      :style="{
        background: 'var(--accent)',
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
    <div class="flex-1 w-full overflow-auto window-content" :style="{ color: 'var(--text-main)' }" id="window-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Importações e definição de propriedades
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

// Sincroniza posição ao receber props novas
watch(() => props.x, val => (pos.value.x = val))
watch(() => props.y, val => (pos.value.y = val))

// Emite evento para trazer janela para frente
function bringToFront() {
  emit('bringToFront')
}

// Maximiza a janela
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

// Restaura a janela ao tamanho/posição anterior
function restore() {
  pos.value.x = prevState.value.x
  pos.value.y = prevState.value.y
  size.value.width = prevState.value.width
  size.value.height = prevState.value.height
  maximized.value = false
  emit('update:position', { x: pos.value.x, y: pos.value.y })
  emit('update:size', { width: size.value.width, height: size.value.height })
}

// Inicializa drag e resize com interact.js
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
.window-header {
  min-height: 28px;
  /* barra mais fina */
  padding-top: 0.25rem !important;
  padding-bottom: 0.25rem !important;
  padding-left: 0.5rem !important;
  padding-right: 0.5rem !important;
}
.window-title {
  font-size: 0.95rem;
  line-height: 1.2;
}
.window-actions {
  gap: 0.125rem;
}
.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.3rem;
  border: none;
  background: transparent;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  color: var(--window-btn-minimize, #fff);
  outline: none;
  cursor: pointer;
  padding: 0;
}
.window-btn svg {
  display: block;
  width: 1rem;
  height: 1rem;
}
.window-btn-minimize { color: var(--window-btn-minimize, #fff); }
.window-btn-maximize { color: var(--window-btn-maximize, #fff); }
.window-btn-restore  { color: var(--window-btn-restore, #fff); }
.window-btn-close    { color: var(--window-btn-close, #fff); }

.window-btn:hover {
  background: rgba(255,255,255,0.08);
  box-shadow: 0 0 0 2px var(--accent, #2563eb);
}
.window-btn-close:hover {
  background: rgba(239,68,68,0.15);
  box-shadow: 0 0 0 2px var(--window-btn-close, #ef4444);
}
.window-btn-maximize:hover {
  background: rgba(34,197,94,0.12);
  box-shadow: 0 0 0 2px var(--window-btn-maximize, #22c55e);
}
.window-btn-minimize:hover {
  background: rgba(234,179,8,0.12);
  box-shadow: 0 0 0 2px var(--window-btn-minimize, #eab308);
}
.window-btn-restore:hover {
  background: rgba(59,130,246,0.12);
  box-shadow: 0 0 0 2px var(--window-btn-restore, #3b82f6);
}
</style>