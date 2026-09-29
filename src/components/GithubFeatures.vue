<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
      <font-awesome-icon icon="fa-brands fa-github" class="text-gray-400 text-2xl" />
      GitHub Features
    </h2>
    <div v-if="!githubToken">
      <p>Faça login com o GitHub para acessar suas features.</p>
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
import { ref, watch, onMounted, computed } from 'vue'
import { Octokit } from '@octokit/rest'

const githubToken = ref(localStorage.getItem('github_token') || '')
const octokit = computed(() => githubToken.value ? new Octokit({ auth: githubToken.value }) : null)

const repos = ref([])
const selectedRepo = ref('')
const issues = ref([])
const pullRequests = ref([])
const commits = ref([])

onMounted(async () => {
  if (octokit.value) {
    const { data } = await octokit.value.repos.listForAuthenticatedUser()
    repos.value = data
    if (data.length) selectedRepo.value = data[0].full_name
  }
})

watch(selectedRepo, async (repo) => {
  if (repo && octokit.value) {
    const [owner, repoName] = repo.split('/')
    issues.value = (await octokit.value.issues.listForRepo({ owner, repo: repoName })).data
    pullRequests.value = (await octokit.value.pulls.list({ owner, repo: repoName })).data
    commits.value = (await octokit.value.repos.listCommits({ owner, repo: repoName, per_page: 10 })).data
  }
})
</script>