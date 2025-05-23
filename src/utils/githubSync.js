import { Octokit } from '@octokit/rest'

const REPO_NAME = 'dev-room-data'
const FILE_PATH = 'dev-room-data.json'

// Garante que o repositório existe, senão cria
export async function ensureRepo(octokit, userLogin) {
  try {
    await octokit.repos.get({ owner: userLogin, repo: REPO_NAME })
  } catch {
    await octokit.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      private: true,
      description: 'Backup dos dados do Dev Room'
    })
  }
}

// Salva os dados no repositório do usuário
export async function saveDataToRepo(githubToken, userLogin, data) {
  const octokit = new Octokit({ auth: githubToken })
  await ensureRepo(octokit, userLogin)

  // Parse local data e atualize lastModified
  let parsed
  try { parsed = JSON.parse(data) } catch { parsed = {} }
  parsed.lastModified = Date.now()
  data = JSON.stringify(parsed)

  // 1. Sempre busque o remoto antes de salvar
  let sha, remoteLastModified = 0, remoteContent = '{}'
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: userLogin,
      repo: REPO_NAME,
      path: FILE_PATH
    })
    sha = fileData.sha
    remoteContent = decodeURIComponent(escape(atob(fileData.content)))
    try { remoteLastModified = JSON.parse(remoteContent).lastModified || 0 } catch {}
  } catch (err) {
    if (err.status !== 404) throw err
  }

  // 2. Se o remoto for mais novo, use ele como base (last-write-wins)
  if (remoteLastModified > parsed.lastModified) {
    // Opcional: merge inteligente aqui, se quiser
    return false // Não salva, pois o remoto é mais novo
  }

  // 3. Tente salvar normalmente
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: userLogin,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: 'Atualizando dados do Dev Room',
      content: btoa(unescape(encodeURIComponent(data))),
      sha
    })
    return true
  } catch (err) {
    // 4. Se der 409, busque o remoto de novo, faça merge e tente salvar
    if (err.status === 409) {
      const { data: fileData } = await octokit.repos.getContent({
        owner: userLogin,
        repo: REPO_NAME,
        path: FILE_PATH
      })
      const remoteContent = decodeURIComponent(escape(atob(fileData.content)))
      let remoteParsed
      try { remoteParsed = JSON.parse(remoteContent) } catch { remoteParsed = {} }
      // Merge: sempre vence o lastModified mais recente
      if ((remoteParsed.lastModified || 0) > parsed.lastModified) {
        // Opcional: merge mais avançado aqui
        return false
      }
      await octokit.repos.createOrUpdateFileContents({
        owner: userLogin,
        repo: REPO_NAME,
        path: FILE_PATH,
        message: 'Atualizando dados do Dev Room',
        content: btoa(unescape(encodeURIComponent(data))),
        sha: fileData.sha
      })
      return true
    } else {
      throw err
    }
  }
}

// Carrega os dados do repositório do usuário
export async function loadDataFromRepo(githubToken, userLogin) {
  const octokit = new Octokit({ auth: githubToken })
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: userLogin,
      repo: REPO_NAME,
      path: FILE_PATH
    })
    return decodeURIComponent(escape(atob(fileData.content)))
  } catch (err) {
    if (err.status === 404) {
      return '{}'
    }
    throw err
  }
}

// Sincroniza backup do GitHub para localStorage a cada 3s
setInterval(async () => {
  if (githubToken.value && githubUserLogin.value) {
    await loadDataFromRepoAndSet()
  }
}, 3000)