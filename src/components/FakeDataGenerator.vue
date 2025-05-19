<template>
  <div class="flex flex-col items-center justify-center w-full h-full p-4 min-w-[220px] min-h-[220px]">
    <h2 class="text-xl font-bold mb-4 text-lime-400">Gerador de Dados Fakes</h2>
    <div class="w-full mb-4">
      <label class="block mb-1 text-sm font-semibold text-lime-200">Tipo de dado:</label>
      <select v-model="selectedType" class="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none">
        <option v-for="type in types" :key="type.value" :value="type.value">{{ type.label }}</option>
      </select>
    </div>
    <div v-if="selectedType === 'lorem'" class="w-full mb-4 flex gap-2 items-center flex-wrap">
      <label class="text-sm text-gray-300">Parágrafos:</label>
      <input type="number" min="1" max="10" v-model.number="loremCount" class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none" />
      <label class="text-sm text-gray-300">Palavras:</label>
      <input type="number" min="1" max="100" v-model.number="loremWords" class="w-16 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none" />
    </div>
    <button @click="generate" class="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded font-bold mb-4 transition w-full">
      Gerar
    </button>
    <div v-if="result" class="w-full bg-gray-900 rounded p-3 mb-2 font-mono text-sm text-lime-100 break-words relative">
      <button @click="copyResult" class="absolute top-2 right-2 text-lime-300 hover:text-lime-100" title="Copiar">
        <font-awesome-icon icon="fa-solid fa-copy" />
      </button>
      <pre class="whitespace-pre-wrap">{{ result }}</pre>
    </div>
    <div v-if="copied" class="text-green-400 text-xs mt-1">Copiado!</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { faker } from '@faker-js/faker'

const types = [
  { value: 'name', label: 'Nome completo' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'date', label: 'Data (nascimento)' },
  { value: 'address', label: 'Endereço completo' },
  { value: 'city', label: 'Cidade' },
  { value: 'state', label: 'Estado' },
  { value: 'zip', label: 'CEP' },
  { value: 'lorem', label: 'Lorem Ipsum' }
]

const selectedType = ref('name')
const result = ref('')
const copied = ref(false)
const loremCount = ref(2)
const loremWords = ref(0)

function generateCPF() {
  let n = 9, n1 = random(n), n2 = random(n), n3 = random(n), n4 = random(n), n5 = random(n), n6 = random(n), n7 = random(n), n8 = random(n), n9 = random(n)
  let d1 = calcDV([n1, n2, n3, n4, n5, n6, n7, n8, n9], 10)
  let d2 = calcDV([n1, n2, n3, n4, n5, n6, n7, n8, n9, d1], 11)
  return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`
  function random(n) { return Math.floor(Math.random() * n) }
  function calcDV(nums, factor) {
    let sum = nums.reduce((acc, num) => acc + num * factor--, 0)
    let dv = 11 - (sum % 11)
    return dv > 9 ? 0 : dv
  }
}

function generateCNPJ() {
  let n = 9, n1 = random(n), n2 = random(n), n3 = random(n), n4 = random(n), n5 = random(n), n6 = random(n), n7 = random(n), n8 = random(n)
  let n9 = 0, n10 = 0, n11 = 0, n12 = 1
  let d1 = calcDV([n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12], [5,4,3,2,9,8,7,6,5,4,3,2])
  let d2 = calcDV([n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12, d1], [6,5,4,3,2,9,8,7,6,5,4,3,2])
  return `${n1}${n2}.${n3}${n4}${n5}.${n6}${n7}${n8}/${n9}${n10}${n11}${n12}-${d1}${d2}`
  function random(n) { return Math.floor(Math.random() * n) }
  function calcDV(nums, factors) {
    let sum = nums.reduce((acc, num, i) => acc + num * factors[i], 0)
    let dv = sum % 11
    return dv < 2 ? 0 : 11 - dv
  }
}

function generate() {
  copied.value = false
  switch (selectedType.value) {
    case 'name':
      result.value = faker.person.fullName()
      break
    case 'email':
      result.value = faker.internet.email().toLowerCase()
      break
    case 'phone':
      result.value = faker.phone.number('(##) #####-####')
      break
    case 'cpf':
      result.value = generateCPF()
      break
    case 'cnpj':
      result.value = generateCNPJ()
      break
    case 'date':
      result.value = faker.date.birthdate({ min: 1950, max: 2005, mode: 'year' }).toLocaleDateString('pt-BR')
      break
    case 'address':
      result.value = `${faker.location.streetAddress()}, ${faker.location.city()} - ${faker.location.state({ abbreviated: true })}, ${faker.location.zipCode()}`
      break
    case 'city':
      result.value = faker.location.city()
      break
    case 'state':
      result.value = faker.location.state()
      break
    case 'zip':
      result.value = faker.location.zipCode()
      break
    case 'lorem':
      if (loremWords.value > 0) {
        result.value = faker.lorem.words(loremWords.value)
      } else {
        result.value = faker.lorem.paragraphs(loremCount.value, '\n\n')
      }
      break
    default:
      result.value = ''
  }
}

function copyResult() {
  navigator.clipboard.writeText(result.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>