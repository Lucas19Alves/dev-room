<template>
  <!-- Notas fixadas na área de trabalho (desktop) -->
  <div>
    <div
      v-for="note in floatingNotes"
      :key="note.id"
      class="sticky-note"
      :style="{ left: `${note.x}px`, top: `${note.y}px`, background: noteColor(note, notes.indexOf(note)) }"
      @pointerdown="startDrag(note, $event)"
    >
      <div class="sticky-bar">
        <span class="grip" aria-hidden="true">⋮⋮</span>
        <button type="button" @click="note.floating = false" title="Recolher para Notas Rápidas"><font-awesome-icon icon="fa-solid fa-down-left-and-up-right-to-center" /></button>
        <button type="button" class="danger" @click="removeNote(note)" title="Remover"><font-awesome-icon icon="fa-solid fa-trash" /></button>
      </div>
      <textarea v-model="note.text" rows="5" aria-label="Texto da nota"></textarea>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'
import { notes } from '../stores/notesStore'
import { noteColor } from '../utils/noteColors'

const floatingNotes = computed(() => notes.value.filter(n => n.floating))

function removeNote(note) {
  if (note.text?.trim() && !confirm('Remover esta nota?')) return
  notes.value = notes.value.filter(n => n.id !== note.id)
}

// Arrastar com mouse ou toque, limitado à janela.
let dragging = null
let offsetX = 0
let offsetY = 0

function startDrag(note, event) {
  if (event.target.closest('textarea, button')) return
  dragging = note
  offsetX = event.clientX - note.x
  offsetY = event.clientY - note.y
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', stopDrag)
}

function onDrag(event) {
  if (!dragging) return
  dragging.x = Math.round(Math.max(0, Math.min(window.innerWidth - 200, event.clientX - offsetX)))
  dragging.y = Math.round(Math.max(0, Math.min(window.innerHeight - 80, event.clientY - offsetY)))
}

function stopDrag() {
  dragging = null
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
}

onUnmounted(stopDrag)
</script>

<style scoped>
.sticky-note { position: fixed; z-index: 9998; width: 230px; padding: 6px 10px 10px; border-radius: 14px; box-shadow: 0 14px 36px rgba(0, 0, 0, .22); color: #222; touch-action: none; cursor: grab; }
.sticky-bar { display: flex; align-items: center; gap: 2px; }
.grip { flex: 1; color: rgba(0, 0, 0, .35); letter-spacing: -2px; user-select: none; }
.sticky-bar button { padding: 3px 5px; color: rgba(0, 0, 0, .45); font-size: 12px; cursor: pointer; background: transparent; }
.sticky-bar button:hover { color: rgba(0, 0, 0, .85); }
.sticky-bar button.danger:hover { color: #d70015; }
.sticky-note textarea { width: 100%; background: transparent !important; border: 0 !important; box-shadow: none !important; color: #222 !important; resize: vertical; font-size: 13.5px; line-height: 1.5; padding: 0 !important; outline: none; cursor: text; }
</style>
