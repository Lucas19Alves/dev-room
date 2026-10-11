// Provedores de IA usados direto do navegador com a chave do próprio usuário.
// `openai` cobre qualquer API compatível com /chat/completions.
export const providers = {
  openai: {
    label: 'OpenAI', kind: 'openai', baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4o-mini'], keyUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    label: 'Anthropic (Claude)', kind: 'anthropic',
    models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'], keyUrl: 'https://console.anthropic.com/settings/keys'
  },
  gemini: {
    label: 'Google Gemini', kind: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'], keyUrl: 'https://aistudio.google.com/apikey'
  },
  groq: {
    label: 'Groq', kind: 'openai', baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3-32b'], keyUrl: 'https://console.groq.com/keys'
  },
  openrouter: {
    label: 'OpenRouter', kind: 'openai', baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openrouter/auto'], keyUrl: 'https://openrouter.ai/keys'
  },
  mistral: {
    label: 'Mistral', kind: 'openai', baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'], keyUrl: 'https://console.mistral.ai/api-keys'
  },
  deepseek: {
    label: 'DeepSeek', kind: 'openai', baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'], keyUrl: 'https://platform.deepseek.com/api_keys'
  },
  ollama: {
    label: 'Ollama (local)', kind: 'openai', baseUrl: 'http://localhost:11434/v1', optionalKey: true, editableUrl: true,
    models: ['llama3.2', 'qwen2.5-coder', 'gemma3'], help: 'Rode o Ollama com OLLAMA_ORIGINS liberando este site.'
  },
  custom: {
    label: 'Compatível com OpenAI', kind: 'openai', baseUrl: '', optionalKey: true, editableUrl: true,
    models: [], help: 'Qualquer servidor com /chat/completions (LM Studio, vLLM, LiteLLM...).'
  }
}

// Modelos Claude que aceitam o fallback automático do servidor em recusas.
const FALLBACK_MODELS = new Set(['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'])

const trimSlash = url => String(url || '').trim().replace(/\/+$/, '')

async function readError(response) {
  let message = `Erro ${response.status}`
  try {
    const data = await response.json()
    message = data.error?.message || data.message || data[0]?.error?.message || message
  } catch {}
  if (response.status === 401 || response.status === 403) message = `Chave recusada pelo provedor. ${message}`
  if (response.status === 429) message = `Limite de uso atingido. ${message}`
  return new Error(message)
}

// Lê um corpo SSE e entrega o JSON de cada evento `data:`.
async function* readSSE(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop()
    for (const event of events) {
      for (const line of event.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try { yield JSON.parse(payload) } catch {}
      }
    }
  }
}

async function streamOpenAI({ baseUrl, apiKey, model, system, messages, signal, onText }) {
  const url = trimSlash(baseUrl)
  if (!url) throw new Error('Informe a URL base do servidor.')
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST', headers, signal,
    body: JSON.stringify({
      model, stream: true,
      messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages]
    })
  })
  if (!response.ok) throw await readError(response)
  let finish = null
  for await (const chunk of readSSE(response)) {
    if (chunk.error) throw new Error(chunk.error.message || 'Erro do provedor.')
    const choice = chunk.choices?.[0]
    if (choice?.delta?.content) onText(choice.delta.content)
    if (choice?.finish_reason) finish = choice.finish_reason
  }
  if (finish === 'length') return { notice: 'Resposta interrompida pelo limite de tamanho do modelo.' }
  if (finish === 'content_filter') return { notice: 'Resposta bloqueada pelo filtro do provedor.' }
  return {}
}

async function streamGemini({ baseUrl, apiKey, model, system, messages, signal, onText }) {
  const response = await fetch(`${trimSlash(baseUrl)}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
    })
  })
  if (!response.ok) throw await readError(response)
  let finish = null
  for await (const chunk of readSSE(response)) {
    const candidate = chunk.candidates?.[0]
    for (const part of candidate?.content?.parts || []) if (part.text && !part.thought) onText(part.text)
    if (candidate?.finishReason) finish = candidate.finishReason
    if (chunk.promptFeedback?.blockReason) return { notice: 'Pergunta bloqueada pelo filtro do Gemini.' }
  }
  if (finish === 'MAX_TOKENS') return { notice: 'Resposta interrompida pelo limite de tamanho do modelo.' }
  if (finish === 'SAFETY') return { notice: 'Resposta bloqueada pelo filtro do Gemini.' }
  return {}
}

async function anthropicClient(apiKey) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  // A chave é do próprio usuário e fica só neste navegador.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

async function streamAnthropic({ apiKey, model, system, messages, signal, onText }) {
  const client = await anthropicClient(apiKey)
  const withFallback = FALLBACK_MODELS.has(model)
  const stream = client.beta.messages.stream({
    model,
    max_tokens: 64000,
    ...(system ? { system } : {}),
    messages,
    ...(withFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {})
  })
  const abort = () => stream.abort()
  signal?.addEventListener('abort', abort)
  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') onText(event.delta.text)
    }
    const message = await stream.finalMessage()
    if (message.stop_reason === 'refusal') return { notice: 'O modelo recusou esta solicitação.' }
    if (message.stop_reason === 'max_tokens') return { notice: 'Resposta interrompida pelo limite de tamanho.' }
    if (message.model && message.model !== model) return { notice: `Respondido por ${message.model}.` }
    return {}
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError')
    if (error?.status === 401) throw new Error('Chave recusada pela Anthropic.')
    if (error?.status === 429) throw new Error('Limite de uso atingido na Anthropic. Tente novamente em instantes.')
    throw new Error(error?.error?.error?.message || error?.message || 'Erro ao consultar a Anthropic.')
  } finally {
    signal?.removeEventListener('abort', abort)
  }
}

// Envia a conversa e repassa o texto conforme chega. Retorna `{ notice? }`.
export function streamChat(providerId, options) {
  const provider = providers[providerId] || providers.openai
  const baseUrl = options.baseUrl || provider.baseUrl
  if (provider.kind === 'anthropic') return streamAnthropic(options)
  if (provider.kind === 'gemini') return streamGemini({ ...options, baseUrl })
  return streamOpenAI({ ...options, baseUrl })
}

// Lista os modelos disponíveis para a chave informada.
export async function listModels(providerId, { apiKey, baseUrl }) {
  const provider = providers[providerId] || providers.openai
  if (provider.kind === 'anthropic') {
    const client = await anthropicClient(apiKey)
    const ids = []
    for await (const model of client.models.list()) ids.push(model.id)
    return ids
  }
  if (provider.kind === 'gemini') {
    const response = await fetch(`${trimSlash(baseUrl || provider.baseUrl)}/models?pageSize=1000`, { headers: { 'x-goog-api-key': apiKey } })
    if (!response.ok) throw await readError(response)
    const data = await response.json()
    return (data.models || [])
      .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
      .map(model => model.name.replace(/^models\//, ''))
  }
  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
  const response = await fetch(`${trimSlash(baseUrl || provider.baseUrl)}/models`, { headers })
  if (!response.ok) throw await readError(response)
  const data = await response.json()
  return (data.data || data.models || []).map(model => model.id || model.name).filter(Boolean).sort()
}
