<template>
  <div class="flex flex-col h-full w-full p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg" id="chatgptapi-main">
    <!-- Configuração da API -->
    <div class="mb-4 flex flex-col gap-2 bg-gray-800/80 p-4 rounded-lg border border-gray-700" id="chatgptapi-config">
      <label for="chatgptapi-key" class="font-semibold text-blue-300 flex items-center gap-2">
        <font-awesome-icon icon="fa-solid fa-key" class="text-blue-400" />
        Sua chave da OpenAI (API Key)
      </label>
      <input
        v-model="apiKey"
        type="password"
        placeholder="Cole sua chave secreta da OpenAI aqui..."
        class="px-3 py-2 rounded bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none"
        id="chatgptapi-key"
        autocomplete="off"
      />
      <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
        <font-awesome-icon icon="fa-solid fa-circle-info" class="text-blue-400" />
        <span>
          Sua chave nunca é enviada para terceiros. <a href="https://platform.openai.com/api-keys" target="_blank" class="underline text-blue-300">Obtenha sua chave aqui</a>.
        </span>
      </div>
    </div>

    <!-- Histórico de mensagens -->
    <div class="flex-1 w-full overflow-auto rounded border border-gray-700 bg-gray-900 p-4 mb-3" id="chatgptapi-messages">
      <div v-if="messages.length === 0" class="text-gray-400 text-center mt-8">
        <font-awesome-icon icon="fa-solid fa-robot" class="text-4xl mb-2 text-blue-400" />
        <div>Converse com a IA! Digite sua pergunta abaixo.</div>
      </div>
      <div v-for="(msg, idx) in messages" :key="idx" class="mb-6">
        <div v-if="msg.role === 'user'" class="flex items-start gap-2 mb-1">
          <font-awesome-icon icon="fa-solid fa-user-astronaut" class="text-blue-300 mt-1" />
          <div>
            <div class="font-bold text-blue-300">Você:</div>
            <div class="whitespace-pre-line bg-blue-950/60 rounded px-3 py-2 mt-1">{{ msg.content }}</div>
          </div>
        </div>
        <div v-if="msg.role === 'assistant'" class="flex items-start gap-2 mb-1">
          <font-awesome-icon icon="fa-solid fa-robot" class="text-green-400 mt-1" />
          <div>
            <div class="font-bold text-green-300">IA:</div>
            <div class="whitespace-pre-line bg-green-950/60 rounded px-3 py-2 mt-1">{{ msg.content }}</div>
          </div>
        </div>
      </div>
      <div v-if="loading" class="text-gray-400 flex items-center gap-2">
        <font-awesome-icon icon="fa-solid fa-spinner" spin />
        Pensando...
      </div>
      <div v-if="error" class="text-red-400 mt-2">{{ error }}</div>
    </div>

    <!-- Formulário de envio -->
    <form @submit.prevent="sendMessage" class="flex gap-2" id="chatgptapi-form">
      <input
        v-model="userInput"
        type="text"
        placeholder="Pergunte algo para a IA..."
        class="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
        id="chatgptapi-input"
        autocomplete="off"
        :disabled="!apiKey"
      />
      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition font-bold"
        :disabled="loading || !userInput.trim() || !apiKey"
        id="chatgptapi-send-btn"
      >
        <font-awesome-icon icon="fa-solid fa-paper-plane" />
        Enviar
      </button>
      <button
        type="button"
        class="bg-gray-700 hover:bg-gray-800 text-gray-200 px-4 py-2 rounded transition font-bold"
        @click="clearMessages"
        :disabled="loading || messages.length === 0"
        id="chatgptapi-clear-btn"
      >
        <font-awesome-icon icon="fa-solid fa-trash" />
        Limpar
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Chave da API do usuário (armazenada apenas localmente)
const apiKey = ref(localStorage.getItem('chatgpt_api_key') || '')
const userInput = ref('')
const messages = ref([])
const loading = ref(false)
const error = ref('')

// Salva a chave da API localmente sempre que mudar
watch(apiKey, (val) => {
  localStorage.setItem('chatgpt_api_key', val)
})

// Envia mensagem para a API do ChatGPT
async function sendMessage() {
  if (!userInput.value.trim() || !apiKey.value) return
  error.value = ''
  loading.value = true
  messages.value.push({ role: 'user', content: userInput.value })
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 512,
        temperature: 0.7
      })
    })
    const data = await response.json()
    if (data.choices && data.choices[0] && data.choices[0].message) {
      messages.value.push({ role: 'assistant', content: data.choices[0].message.content.trim() })
    } else if (data.error && data.error.message) {
      error.value = 'Erro: ' + data.error.message
    } else {
      error.value = 'Erro ao obter resposta da IA.'
    }
  } catch (e) {
    error.value = 'Erro de conexão com a API.'
  }
  userInput.value = ''
  loading.value = false
}

// Limpa o histórico de mensagens
function clearMessages() {
  messages.value = []
  error.value = ''
}
</script>