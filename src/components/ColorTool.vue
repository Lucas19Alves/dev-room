<template>
  <div class="tool" :style="{ '--app-accent-rgb': `${rgb.r}, ${rgb.g}, ${rgb.b}` }" id="color-tool">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Cores</h2>
        <p class="tool-sub">Converta HEX, RGB e HSL, gere tons e confira o contraste.</p>
      </div>
    </div>

    <div class="tool-row">
      <input type="color" :value="hex.slice(0, 7)" @input="state.color = $event.target.value" class="swatch-input" aria-label="Escolher cor" />
      <input v-model="state.color" class="tool-mono tool-grow" spellcheck="false" placeholder="#0a84ff, rgb(10 132 255) ou hsl(211 100% 52%)" aria-label="Cor" id="color-input" />
    </div>
    <p v-if="!parsed" class="tool-error">Cor não reconhecida. Use HEX, rgb() ou hsl().</p>

    <div class="tool-card preview" :style="{ background: hex }">
      <span :style="{ color: bestText }">Aa · {{ hex }}</span>
    </div>

    <div class="tool-card">
      <dl class="kv">
        <template v-for="row in formats" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
          <button type="button" class="btn btn-sm" @click="copy(row.value, row.label)">{{ copied === row.label ? 'Copiado!' : 'Copiar' }}</button>
        </template>
      </dl>
    </div>

    <div class="tool-card">
      <span class="tool-label">Tons</span>
      <div class="shades">
        <button v-for="shade in shades" :key="shade" type="button" :style="{ background: shade }" :title="shade" @click="state.color = shade" :aria-label="`Usar ${shade}`"></button>
      </div>
    </div>

    <div class="tool-card">
      <div class="tool-row contrast-head">
        <span class="tool-label">Contraste (WCAG) com</span>
        <input type="color" :value="bgHex" @input="state.background = $event.target.value" class="swatch-input small" aria-label="Cor de fundo" />
        <input v-model="state.background" class="tool-mono bg-input" spellcheck="false" aria-label="Cor de fundo" />
      </div>
      <div class="contrast-preview" :style="{ background: bgHex, color: hex }">
        <strong>Texto de exemplo</strong> <span>com a cor escolhida</span>
      </div>
      <div class="tool-row">
        <span class="chip">{{ ratio.toFixed(2) }}:1</span>
        <span class="chip" :class="ratio >= 4.5 ? 'ok' : 'bad'">AA texto {{ ratio >= 4.5 ? '✓' : '✗' }}</span>
        <span class="chip" :class="ratio >= 3 ? 'ok' : 'bad'">AA grande {{ ratio >= 3 ? '✓' : '✗' }}</span>
        <span class="chip" :class="ratio >= 7 ? 'ok' : 'bad'">AAA {{ ratio >= 7 ? '✓' : '✗' }}</span>
      </div>
    </div>

    <div v-if="state.recent.length" class="tool-card">
      <span class="tool-label">Recentes</span>
      <div class="shades recent">
        <button v-for="color in state.recent" :key="color" type="button" :style="{ background: color }" :title="color" @click="state.color = color" :aria-label="`Usar ${color}`"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useLocalDraft } from '../composables/useLocalDraft'
import { useCopy } from '../utils/clipboard'
import { parseColor, rgbToHex, rgbToHsl, hslToRgb, contrastRatio } from '../utils/devtools'

const state = useLocalDraft('color', { color: '#0a84ff', background: '#ffffff', recent: [] })
const { copied, copy } = useCopy()
let lastGood = { r: 10, g: 132, b: 255, a: 1 }

const parsed = computed(() => parseColor(state.value.color))
const rgb = computed(() => {
  if (parsed.value) lastGood = parsed.value
  return lastGood
})
const hex = computed(() => rgbToHex(rgb.value))
const hsl = computed(() => rgbToHsl(rgb.value))
const bg = computed(() => parseColor(state.value.background) || { r: 255, g: 255, b: 255 })
const bgHex = computed(() => rgbToHex({ ...bg.value, a: 1 }))
const ratio = computed(() => contrastRatio(rgb.value, bg.value))
const bestText = computed(() => contrastRatio(rgb.value, { r: 255, g: 255, b: 255 }) >= contrastRatio(rgb.value, { r: 0, g: 0, b: 0 }) ? '#fff' : '#000')

const formats = computed(() => {
  const { r, g, b, a } = rgb.value
  const { h, s, l } = hsl.value
  const alpha = a < 1 ? ` / ${+a.toFixed(2)}` : ''
  return [
    { label: 'HEX', value: hex.value },
    { label: 'RGB', value: `rgb(${r} ${g} ${b}${alpha})` },
    { label: 'HSL', value: `hsl(${h} ${s}% ${l}%${alpha})` },
    { label: 'Tailwind', value: `[${hex.value}]` },
    { label: 'CSS var', value: `--cor: ${hex.value};` }
  ]
})

const shades = computed(() => {
  const { h, s } = hsl.value
  return [95, 85, 75, 65, 55, 45, 35, 25, 15].map(l => rgbToHex(hslToRgb(h, s, l)))
})

let recentTimer = 0
watch(hex, value => {
  clearTimeout(recentTimer)
  recentTimer = setTimeout(() => {
    state.value.recent = [value, ...state.value.recent.filter(c => c !== value)].slice(0, 12)
  }, 1200)
})
</script>

<style scoped>
.swatch-input { width: 44px; height: 38px; padding: 2px !important; cursor: pointer; flex: none; }
.swatch-input.small { width: 34px; height: 30px; min-height: 0 !important; }
.preview { height: 84px; display: grid; place-items: center; font: 600 18px ui-monospace, monospace; border: 0; }
.shades { display: grid; grid-template-columns: repeat(9, 1fr); gap: 4px; }
.shades.recent { grid-template-columns: repeat(12, 1fr); }
.tool .shades button { min-height: 0 !important; height: 30px; padding: 0 !important; border-radius: 8px; border: 1px solid var(--glass-border); cursor: pointer; }
.contrast-head { margin-bottom: 8px; }
.contrast-head .tool-label { margin: 0; }
.bg-input { width: 110px; min-height: 30px !important; }
.contrast-preview { border-radius: 10px; padding: 12px; margin-bottom: 8px; border: 1px solid var(--glass-border); font-size: 14px; }
</style>
