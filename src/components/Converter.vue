<template>
  <!-- Container principal do Conversor de Moedas -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[180px] min-h-[180px]"
    id="currency-main">
    <h2 class="text-xl font-bold mb-4 text-green-300" id="currency-title">Conversor de moedas</h2>

    <!-- Seletor de moedas e valor -->
    <form @submit.prevent class="flex flex-col gap-2 w-full max-w-sm" id="currency-form">
      <input v-model.number="amount" type="number" placeholder="Valor" min="0" step="any" aria-label="Valor para converter"
        class="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="currency-amount" />

      <div class="flex gap-2">
        <select aria-label="Moeda de origem" v-model="selectedFrom"
          class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none">
          <option v-for="c in currencies" :key="c.code" :value="c.code">
            {{ c.code }}
          </option>
        </select>

        <span class="text-gray-400 flex items-center">→</span>

        <select aria-label="Moeda de destino" v-model="selectedTo"
          class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none">
          <option v-for="c in currencies" :key="c.code" :value="c.code">
            {{ c.code }}
          </option>
        </select>
      </div>

      <button :disabled="loading" @click="convertCurrency"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition mt-2" id="currency-convert-btn">
        {{ loading ? 'Convertendo…' : 'Converter' }}
      </button>
    </form>

    <p v-if="error" role="alert" class="mt-3 text-sm">{{ error }}</p>
    <!-- Resultado da conversão -->
    <div v-if="result !== null" class="mt-4 text-lg text-white font-medium" id="currency-result">
      {{ convertedAmount }} {{ fromCurrency }} = {{ result }} {{ toCurrency }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

// Estado salvo
const allData = getDevRoomData()

// Campos fixos 
const amount = ref(allData.currencyAmount ?? 1)
const fromCurrency = ref(allData.currencyFrom || 'USD')
const toCurrency = ref(allData.currencyTo || 'BRL')

// Campos temporários 
const selectedFrom = ref(fromCurrency.value)
const selectedTo = ref(toCurrency.value)

const result = ref(null)
const convertedAmount = ref(0)
const loading = ref(false)
const error = ref('')

const currencies = ref([])

async function loadCurrencies() {
  try {
    const res = await fetch('https://api.frankfurter.app/currencies')
    if (!res.ok) throw new Error('Não foi possível carregar moedas.')
    const data = await res.json()
    currencies.value = Object.entries(data).map(([code, name]) => ({ code, name }))
  } catch (err) {
    error.value = 'Não foi possível carregar as moedas. Tente reabrir a ferramenta.'
  }
}

// Converter
async function convertCurrency() {
  if (loading.value) return
  error.value = ''
  const value = Number(amount.value)
  if (amount.value === '' || !Number.isFinite(value) || value < 0) { error.value = 'Digite um valor válido, igual ou maior que zero.'; return }
  const from = selectedFrom.value
  const to = selectedTo.value
  loading.value = true
  try {
    let converted = value
    if (from !== to && value !== 0) {
      const response = await fetch('https://api.frankfurter.app/latest?' + new URLSearchParams({ amount: value, from, to }), { signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error('Cotação indisponível.')
      const data = await response.json()
      converted = data.rates?.[to]
      if (!Number.isFinite(converted)) throw new Error('Cotação inválida.')
    }
    result.value = converted.toFixed(2)
    convertedAmount.value = value
    fromCurrency.value = from
    toCurrency.value = to
  } catch { result.value = null; error.value = 'Não foi possível consultar a cotação. Tente novamente.' }
  finally { loading.value = false }
}

watch([amount, fromCurrency, toCurrency], () => {
  const data = getDevRoomData()
  data.currencyAmount = amount.value
  data.currencyFrom = fromCurrency.value
  data.currencyTo = toCurrency.value
  setDevRoomData(data)
})

function syncFromStorage(e) {
  if (e.key === 'dev-room-data') {
    const data = getDevRoomData()
    amount.value = data.currencyAmount ?? 1
    fromCurrency.value = data.currencyFrom || 'USD'
    toCurrency.value = data.currencyTo || 'BRL'
    selectedFrom.value = fromCurrency.value
    selectedTo.value = toCurrency.value
  }
}

onMounted(() => {
  loadCurrencies()
  window.addEventListener('storage', syncFromStorage)
})

onUnmounted(() => {
  window.removeEventListener('storage', syncFromStorage)
})
</script>
