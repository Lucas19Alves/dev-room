<template>
  <div class="p-4 h-full overflow-auto" id="github-features-main">
    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
      <font-awesome-icon icon="fa-brands fa-github" class="text-gray-400 text-2xl" />
      GitHub
    </h2>
    <p v-if="error" role="alert" class="mb-3">{{ error }}</p>
    <p v-if="loading" role="status">Carregando repositório…</p>
    <div v-if="!githubToken">
      <p>Conecte sua conta pelo botão Entrar para acompanhar seus repositórios.</p>
    </div>
    <div v-else>
      <label class="block mb-2 font-semibold text-gray-300">Repositório:</label>
      <select v-model="selectedRepo" class="mb-4 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 w-full">
        <option v-for="repo in repos" :key="repo.id" :value="repo.full_name">
          {{ repo.full_name }}
        </option>
      </select>
      <div v-if="selectedRepo">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Issues -->
          <div>
            <h3 class="font-bold mb-2 text-blue-300 flex items-center gap-1">
              <font-awesome-icon icon="fa-solid fa-circle-exclamation" class="text-yellow-400" />
              Issues
            </h3>
            <ul class="space-y-1 max-h-48 overflow-auto">
              <li v-for="issue in issues" :key="issue.id" class="bg-gray-800 rounded px-2 py-1 text-sm flex items-center gap-2">
                <span class="text-gray-400">#{{ issue.number }}</span>
                <span>{{ issue.title }}</span>
                <span v-if="issue.state === 'open'" class="ml-auto text-green-400 text-xs">aberta</span>
                <span v-else class="ml-auto text-red-400 text-xs">fechada</span>
              </li>
              <li v-if="!issues.length" class="text-gray-500 text-xs">Nenhuma issue</li>
            </ul>
          </div>
          <!-- Pull Requests -->
          <div>
            <h3 class="font-bold mb-2 text-blue-300 flex items-center gap-1">
              <font-awesome-icon icon="fa-solid fa-code-pull-request" class="text-green-400" />
              Pull Requests
            </h3>
            <ul class="space-y-1 max-h-48 overflow-auto">
              <li v-for="pr in pullRequests" :key="pr.id" class="bg-gray-800 rounded px-2 py-1 text-sm flex items-center gap-2">
                <span class="text-gray-400">#{{ pr.number }}</span>
                <span>{{ pr.title }}</span>
                <span v-if="pr.state === 'open'" class="ml-auto text-green-400 text-xs">aberto</span>
                <span v-else class="ml-auto text-red-400 text-xs">fechado</span>
              </li>
              <li v-if="!pullRequests.length" class="text-gray-500 text-xs">Nenhum PR</li>
            </ul>
          </div>
          <!-- Commits -->
          <div>
            <h3 class="font-bold mb-2 text-blue-300 flex items-center gap-1">
              <font-awesome-icon icon="fa-solid fa-code-commit" class="text-purple-400" />
              Commits
            </h3>
            <ul class="space-y-1 max-h-48 overflow-auto">
              <li v-for="commit in commits" :key="commit.sha" class="bg-gray-800 rounded px-2 py-1 text-xs">
                <span class="font-mono text-gray-400">{{ commit.sha.slice(0, 7) }}</span>
                <span class="ml-2">{{ commit.commit.message }}</span>
              </li>
              <li v-if="!commits.length" class="text-gray-500 text-xs">Nenhum commit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { createGitHubClient } from '../utils/githubSync'
const props = defineProps({ token: { type: String, default: '' } })
const githubToken = computed(() => props.token)
const repos = ref([])
const selectedRepo = ref('')
const issues = ref([])
const pullRequests = ref([])
const commits = ref([])
const error = ref('')
const loading = ref(false)
let requestId = 0
watch(githubToken, async token => {
  requestId++
  repos.value = []; selectedRepo.value = ''; issues.value = []; pullRequests.value = []; commits.value = []
  if (!token) return
  const id = requestId
  try {
    const client = createGitHubClient(token)
    const data = []
    for (let page = 1; page <= 10; page++) {
      const { data: batch } = await client('GET', `/user/repos?per_page=100&sort=updated&page=${page}`)
      data.push(...batch)
      if (batch.length < 100) break
    }
    if (id !== requestId) return
    repos.value = data
    selectedRepo.value = data[0]?.full_name || ''
  } catch { if (id === requestId) error.value = 'Não foi possível carregar seus repositórios.' }
}, { immediate: true })
watch(selectedRepo, async fullName => {
  const id = ++requestId
  error.value = ''; issues.value = []; pullRequests.value = []; commits.value = []
  if (!fullName || !githubToken.value) { loading.value = false; return }
  loading.value = true
  const [owner, repo] = fullName.split('/')
  const client = createGitHubClient(githubToken.value)
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  try {
    const results = await Promise.allSettled([
      client('GET', `${base}/issues?per_page=30`), client('GET', `${base}/pulls?per_page=30`), client('GET', `${base}/commits?per_page=10`)
    ])
    if (id !== requestId) return
    issues.value = results[0].status === 'fulfilled' ? results[0].value.data.filter(issue => !issue.pull_request) : []
    pullRequests.value = results[1].status === 'fulfilled' ? results[1].value.data : []
    commits.value = results[2].status === 'fulfilled' ? results[2].value.data : []
    if (results.some(r => r.status === 'rejected')) error.value = 'Algumas informações não puderam ser carregadas. O repositório pode estar vazio ou temporariamente indisponível.'
  } finally { if (id === requestId) loading.value = false }
})
</script>
