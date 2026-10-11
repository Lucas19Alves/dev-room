<template>
  <div class="tool" style="--app-accent-rgb: 255, 149, 0" id="quicknotes-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Notas Rápidas</h2>
        <p class="tool-sub">{{ notes.length }} nota{{ notes.length === 1 ? '' : 's' }}{{ floatingCount ? ` · ${floatingCount} na área de trabalho` : '' }}</p>
      </div>
      <input v-if="notes.length > 3" v-model="filter" type="search" placeholder="Filtrar notas" class="filter-input" aria-label="Filtrar notas" />
    </div>

    <div class="tool-row">
      <textarea v-model="newNote" rows="2" placeholder="Escreva uma nota… (Ctrl+Enter salva)" class="tool-grow new-note" @keydown.ctrl.enter="addNote" @keydown.meta.enter="addNote" id="quicknotes-input"></textarea>
      <button type="button" class="btn btn-primary" :disabled="!newNote.trim()" @click="addNote" id="quicknotes-add-btn"><font-awesome-icon icon="fa-solid fa-plus" /> Nota</button>
    </div>

    <div class="grid" id="quicknotes-list">
      <article v-for="note in visibleNotes" :key="note.id" class="note" :style="{ background: colorOf(note) }" :class="{ floating: note.floating }">
        <div class="note-bar">
          <button v-for="(color, i) in noteColors" :key="color" type="button" class="swatch" :style="{ background: color }" :class="{ on: colorOf(note) === color }" @click="note.color = i" :aria-label="`Cor ${i + 1}`"></button>
          <span class="spacer"></span>
          <button type="button" class="note-btn" @click="copy(note.text, note.id)" :title="copied === note.id ? 'Copiado!' : 'Copiar'"><font-awesome-icon :icon="copied === note.id ? 'fa-solid fa-check' : 'fa-solid fa-copy'" /></button>
          <button v-if="!isMobile" type="button" class="note-btn" @click="toggleFloat(note)" :title="note.floating ? 'Recolher da área de trabalho' : 'Fixar na área de trabalho'"><font-awesome-icon icon="fa-solid fa-thumbtack" /></button>
          <button type="button" class="note-btn danger" @click="removeNote(note.id)" title="Remover"><font-awesome-icon icon="fa-solid fa-trash" /></button>
        </div>
        <textarea v-model="note.text" rows="5" class="note-text" aria-label="Texto da nota"></textarea>
        <span v-if="note.updatedAt || note.createdAt" class="note-date">{{ formatDate(note.updatedAt || note.createdAt) }}</span>
      </article>
      <p v-if="!visibleNotes.length" class="tool-empty empty">{{ notes.length ? 'Nenhuma nota corresponde ao filtro.' : 'Nenhuma nota ainda.' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { notes, loadNotes } from '../stores/notesStore'
import { useCopy } from '../utils/clipboard'
import { noteColors, noteColor } from '../utils/noteColors'

const newNote = ref('')
const filter = ref('')
const isMobile = ref(false)
const { copied, copy } = useCopy()
const colorOf = note => noteColor(note, notes.value.indexOf(note))
const floatingCount = computed(() => notes.value.filter(n => n.floating).length)
const visibleNotes = computed(() => {
  const q = filter.value.trim().toLowerCase()
  const list = q ? notes.value.filter(n => (n.text || '').toLowerCase().includes(q)) : notes.value
  return [...list].reverse()
})

function addNote() {
  const text = newNote.value.trim()
  if (!text) return
  notes.value.push({ id: Date.now() + Math.random(), text, floating: false, x: 120, y: 120, color: notes.value.length % noteColors.length, createdAt: Date.now() })
  newNote.value = ''
}

function removeNote(id) {
  const note = notes.value.find(n => n.id === id)
  if (note?.text.trim() && !confirm('Remover esta nota?')) return
  notes.value = notes.value.filter(n => n.id !== id)
}

function toggleFloat(note) {
  note.floating = !note.floating
  if (note.floating) {
    note.x = Math.min(window.innerWidth - 260, Math.max(20, note.x ?? 120))
    note.y = Math.min(window.innerHeight - 200, Math.max(60, note.y ?? 120))
  }
}

const formatDate = time => new Date(time).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function checkMobile() { isMobile.value = window.matchMedia('(max-width: 768px)').matches }
onMounted(() => {
  loadNotes()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => window.removeEventListener('resize', checkMobile))
</script>

<style scoped>
.filter-input { width: 160px; min-height: 30px !important; font-size: 12.5px; }
.new-note { resize: vertical; min-height: 44px; }
.grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-content: start; overflow-y: auto; padding: 2px; }
.note { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px 8px; border-radius: 14px; color: #2b2b2b; box-shadow: 0 8px 22px rgba(0, 0, 0, .1); }
.note.floating { outline: 2px dashed rgba(0, 0, 0, .25); outline-offset: -4px; }
.note-bar { display: flex; align-items: center; gap: 3px; }
.spacer { flex: 1; }
.tool .swatch { min-height: 0 !important; width: 11px; height: 11px; padding: 0 !important; border-radius: 50%; border: 1px solid rgba(0, 0, 0, .25); cursor: pointer; }
.tool .swatch.on { box-shadow: 0 0 0 2px rgba(0, 0, 0, .55); }
.tool .note-btn { min-height: 0 !important; padding: 3px 5px !important; background: transparent; border: 0; color: rgba(0, 0, 0, .45); cursor: pointer; font-size: 12px !important; }
.tool .note-btn:hover { color: rgba(0, 0, 0, .85); }
.tool .note-btn.danger:hover { color: #d70015; }
.tool .note-text { background: transparent !important; border: 0 !important; box-shadow: none !important; color: #222 !important; resize: vertical; padding: 0 !important; font-size: 13.5px; line-height: 1.5; min-height: 80px; }
.note-text:focus { box-shadow: none !important; }
.note-date { font-size: 10.5px; color: rgba(0, 0, 0, .45); text-align: right; }
.empty { grid-column: 1 / -1; }
</style>
