<template>
  <div class="tool" style="--app-accent-rgb: 172, 229, 57" id="fakedata-main">
    <div class="tool-head">
      <div>
        <h2 class="tool-title">Gerador de Dados</h2>
        <p class="tool-sub">Dados fictícios brasileiros para testes. Documentos são válidos só no formato.</p>
      </div>
    </div>

    <div class="types">
      <button v-for="type in types" :key="type.value" type="button" class="type" :class="{ on: state.type === type.value }" @click="state.type = type.value">{{ type.label }}</button>
    </div>

    <div class="tool-row">
      <label class="tool-row field">Quantidade <input type="number" min="1" max="100" v-model.number="state.count" /></label>
      <label v-if="state.type === 'password'" class="tool-row field">Tamanho <input type="number" min="8" max="128" v-model.number="state.passwordLength" /></label>
      <label v-if="['cpf', 'cnpj', 'phone', 'zip'].includes(state.type)" class="tool-row field check"><input type="checkbox" v-model="state.masked" /> Com máscara</label>
      <div v-if="state.type === 'person'" class="seg" role="group" aria-label="Formato">
        <button type="button" :class="{ on: state.format === 'json' }" @click="state.format = 'json'">JSON</button>
        <button type="button" :class="{ on: state.format === 'csv' }" @click="state.format = 'csv'">CSV</button>
      </div>
      <span class="tool-grow"></span>
      <button type="button" class="btn btn-primary" @click="generate" :disabled="loading" id="fakedata-generate-btn">
        <font-awesome-icon icon="fa-solid fa-repeat" /> {{ loading ? 'Carregando…' : 'Gerar' }}
      </button>
    </div>

    <div v-if="result" class="tool-card result">
      <div class="result-head">
        <span class="tool-label">{{ currentLabel }} · {{ lines }} {{ lines === 1 ? 'item' : 'itens' }}</span>
        <button type="button" class="btn btn-sm" @click="copy(result, 'all')" id="fakedata-copy-btn">{{ copied === 'all' ? 'Copiado!' : 'Copiar' }}</button>
      </div>
      <pre class="tool-mono out">{{ result }}</pre>
    </div>
    <p v-else class="tool-empty">Escolha um tipo e clique em Gerar.</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useLocalDraft } from '../composables/useLocalDraft'
import { useCopy } from '../utils/clipboard'

const types = [
  { value: 'person', label: 'Pessoa completa' }, { value: 'name', label: 'Nome' }, { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Celular' }, { value: 'cpf', label: 'CPF' }, { value: 'cnpj', label: 'CNPJ' },
  { value: 'company', label: 'Empresa' }, { value: 'address', label: 'Endereço' }, { value: 'zip', label: 'CEP' },
  { value: 'date', label: 'Data de nascimento' }, { value: 'uuid', label: 'UUID' }, { value: 'password', label: 'Senha forte' },
  { value: 'card', label: 'Cartão (teste)' }, { value: 'ip', label: 'IP' }, { value: 'lorem', label: 'Lorem ipsum' }
]
const state = useLocalDraft('fakedata', { type: 'person', count: 3, masked: true, format: 'json', passwordLength: 20 })
const result = ref('')
const loading = ref(false)
const { copied, copy } = useCopy()
const currentLabel = computed(() => types.find(t => t.value === state.value.type)?.label)
const lines = computed(() => state.value.type === 'person' ? Math.max(1, Number(state.value.count) || 1) : result.value.split('\n').filter(Boolean).length)

const digits = n => Array.from({ length: n }, () => Math.floor(Math.random() * 10))
const randomInt = max => crypto.getRandomValues(new Uint32Array(1))[0] % max

function cpf(masked) {
  const n = digits(9)
  const dv = (nums, factor) => { const r = nums.reduce((s, d, i) => s + d * (factor - i), 0) % 11; return r < 2 ? 0 : 11 - r }
  n.push(dv(n, 10)); n.push(dv(n, 11))
  const s = n.join('')
  return masked ? `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}` : s
}

function cnpj(masked) {
  const n = [...digits(8), 0, 0, 0, 1]
  const dv = nums => { const w = nums.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; const r = nums.reduce((s, d, i) => s + d * w[i], 0) % 11; return r < 2 ? 0 : 11 - r }
  n.push(dv(n)); n.push(dv(n))
  const s = n.join('')
  return masked ? `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}` : s
}

// Número de cartão de teste com dígito de Luhn válido (prefixo de testes Visa 4111…).
function card() {
  const n = [4, 1, 1, 1, ...digits(11)]
  const sum = n.reduce((s, d, i) => { let v = (n.length - i) % 2 === 1 ? d * 2 : d; if (v > 9) v -= 9; return s + v }, 0)
  n.push((10 - (sum % 10)) % 10)
  return n.join('').replace(/(\d{4})(?=\d)/g, '$1 ')
}

function password(length) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?-_+=']
  const all = sets.join('')
  const chars = sets.map(set => set[randomInt(set.length)])
  while (chars.length < length) chars.push(all[randomInt(all.length)])
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]] }
  return chars.join('')
}

const phone = masked => { const ddd = 11 + randomInt(89); const n = `9${digits(8).join('')}`; return masked ? `(${ddd}) ${n.slice(0, 5)}-${n.slice(5)}` : `${ddd}${n}` }
const zip = masked => { const s = digits(8).join(''); return masked ? `${s.slice(0, 5)}-${s.slice(5)}` : s }
const strip = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.')

let fakerPromise
const loadFaker = () => (fakerPromise ||= import('@faker-js/faker/locale/pt_BR').then(m => m.faker))

async function generate() {
  loading.value = true
  try {
    const faker = await loadFaker()
    const { type, masked } = state.value
    const count = Math.max(1, Math.min(100, Number(state.value.count) || 1))
    const person = () => {
      const firstName = faker.person.firstName(), lastName = faker.person.lastName()
      return {
        nome: `${firstName} ${lastName}`,
        email: `${strip(firstName)}.${strip(lastName)}${randomInt(100)}@${faker.helpers.arrayElement(['gmail.com', 'outlook.com', 'exemplo.com.br'])}`,
        cpf: cpf(masked), celular: phone(masked),
        nascimento: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().slice(0, 10),
        endereco: { rua: faker.location.street(), numero: String(1 + randomInt(2000)), cidade: faker.location.city(), estado: faker.location.state({ abbreviated: true }), cep: zip(masked) }
      }
    }
    const makers = {
      name: () => faker.person.fullName(),
      email: () => faker.internet.email().toLowerCase(),
      phone: () => phone(masked), cpf: () => cpf(masked), cnpj: () => cnpj(masked), zip: () => zip(masked),
      company: () => faker.company.name(),
      address: () => `${faker.location.street()}, ${1 + randomInt(2000)} — ${faker.location.city()}/${faker.location.state({ abbreviated: true })}, ${zip(true)}`,
      date: () => faker.date.birthdate({ min: 18, max: 75, mode: 'age' }).toLocaleDateString('pt-BR'),
      uuid: () => crypto.randomUUID(),
      password: () => password(Math.max(8, Math.min(128, Number(state.value.passwordLength) || 20))),
      card: () => card(),
      ip: () => faker.internet.ipv4(),
      lorem: () => faker.lorem.paragraph()
    }
    if (type === 'person') {
      const people = Array.from({ length: count }, person)
      result.value = state.value.format === 'csv'
        ? ['nome,email,cpf,celular,nascimento,cidade,estado,cep', ...people.map(p => [p.nome, p.email, p.cpf, p.celular, p.nascimento, p.endereco.cidade, p.endereco.estado, p.endereco.cep].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
        : JSON.stringify(count === 1 ? people[0] : people, null, 2)
    } else {
      result.value = Array.from({ length: count }, makers[type]).join(type === 'lorem' ? '\n\n' : '\n')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.types { display: flex; flex-wrap: wrap; gap: 6px; }
.tool .type { min-height: 0 !important; padding: 5px 10px !important; font-size: 12px !important; border-radius: 999px; border: 1px solid var(--glass-border); background: var(--bg-panel-secondary); color: var(--text-secondary); cursor: pointer; }
.tool .type.on { background: rgb(var(--app-accent-rgb)); color: #1d2a00; border-color: transparent; }
.field { font-size: 12.5px; gap: 6px; color: var(--text-secondary); }
.field input[type="number"] { width: 70px; }
.check { cursor: pointer; }
.result { display: flex; flex-direction: column; gap: 6px; min-height: 0; flex: 1; }
.result-head { display: flex; align-items: center; }
.result-head .tool-label { margin: 0 auto 0 0; }
.out { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; overflow: auto; flex: 1; max-height: 360px; }
</style>
