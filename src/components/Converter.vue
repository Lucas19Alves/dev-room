<template>
  <!-- Container principal do Conversor de Moedas -->
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[180px] min-h-[180px]"
    id="currency-main">
    <h2 class="text-xl font-bold mb-4 text-green-300" id="currency-title">conversor de moedas</h2>

    <!-- Seletor de moedas e valor -->
    <form @submit.prevent class="flex flex-col gap-2 w-full max-w-sm" id="currency-form">
      <input v-model.number="amount" type="number" placeholder="Valor"
        class="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="currency-amount" />

      <div class="flex gap-2">
        <select v-model="selectedFrom"
          class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none">
          <option v-for="c in currencies" :key="c.code" :value="c.code">
            {{ c.code }}
          </option>
        </select>

        <span class="text-gray-400 flex items-center">→</span>

        <select v-model="selectedTo"
          class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none">
          <option v-for="c in currencies" :key="c.code" :value="c.code">
            {{ c.code }}
          </option>
        </select>
      </div>

      <button @click="convertCurrency"
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition mt-2" id="currency-convert-btn">
        Converter
      </button>
    </form>

    <!-- Resultado da conversão -->
    <div v-if="result !== null" class="mt-4 text-lg text-white font-medium" id="currency-result">
      {{ amount }} {{ fromCurrency }} = {{ result }} {{ toCurrency }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getDevRoomData, setDevRoomData } from '../utils/storage'

// Estado salvo
const allData = getDevRoomData()

// Campos fixos 
const amount = ref(allData.currencyAmount || 1)
const fromCurrency = ref(allData.currencyFrom || 'USD')
const toCurrency = ref(allData.currencyTo || 'BRL')

// Campos temporários 
const selectedFrom = ref(fromCurrency.value)
const selectedTo = ref(toCurrency.value)

const result = ref(null)

const currencies = ref([])

async function loadCurrencies() {
  try {
    const res = await fetch('https://api.frankfurter.app/currencies')
    const data = await res.json()
    currencies.value = Object.entries(data).map(([code, name]) => ({ code, name }))
  } catch (err) {
    console.error('Erro ao buscar moedas:', err)
  }
}

// Converter
async function convertCurrency() {
  if (selectedFrom.value === selectedTo.value) {
    result.value = amount.value
    fromCurrency.value = selectedFrom.value
    toCurrency.value = selectedTo.value
    return
  }

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount.value}&from=${selectedFrom.value}&to=${selectedTo.value}`)
    const data = await res.json()
    result.value = data.rates[selectedTo.value].toFixed(2)

    // Só atualiza os nomes quando realmente converter
    fromCurrency.value = selectedFrom.value
    toCurrency.value = selectedTo.value
  } catch (e) {
    result.value = 'Erro ao converter'
  }
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
    amount.value = data.currencyAmount || 1
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
