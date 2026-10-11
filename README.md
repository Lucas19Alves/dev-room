# Dev Room

Um desktop de produtividade para desenvolvedores, feito com Vue 3 e Vite. Reúne tarefas, Kanban, notas, snippets, timers, Pomodoro, música, checklist de deploy, playground e ferramentas do GitHub.

[Usar o Dev Room](https://dev-room-three.vercel.app/) · [Repositório](https://github.com/Lucas19Alves/dev-room)

## Desenvolvimento

```sh
npm ci
npm run dev
npm test
npm run build
```

O Vite serve a interface e as rotas OAuth em desenvolvimento. Para testar o login, copie `.env.example` para `.env.local` e configure seu OAuth App. O callback e `GITHUB_REDIRECT_URI` devem corresponder exatamente à origem utilizada.

## Login GitHub na Vercel

Configure em Production:

- `GITHUB_CLIENT_ID`: Client ID do OAuth App Dev Room.
- `GITHUB_CLIENT_SECRET`: client secret, armazenado como Secret, sem prefixo VITE.
- `GITHUB_REDIRECT_URI`: `https://dev-room-three.vercel.app/` (padrão se omitido).

No GitHub, registre a mesma URL em Redirect URIs. Faça um novo deployment após alterar as variáveis.

A autorização usa state de uso único e PKCE S256; a troca do código ocorre no servidor. O token de usuário permanece na sessão da aba, nunca em armazenamento local persistente. Fechar a aba encerra essa sessão; Sair remove o token sem apagar os dados locais. A autorização solicita `repo` porque o backup precisa criar e atualizar um repositório privado. O secret do aplicativo nunca é enviado à interface.

## Persistência e backup

As ferramentas salvam no navegador (`dev-room-data`). Cada chave registra o instante da última alteração em `_clock`, o que permite mesclar dispositivos ferramenta a ferramenta: se o celular editou notas e o notebook editou tarefas, as duas alterações sobrevivem. Remoções também são propagadas.

Com uma conta conectada, o backup fica em `dev-room-data/dev-room-data.json`, somente em repositório privado (verificado uma vez por sessão, antes da primeira gravação). A sincronização usa a API REST direto, sem SDK:

- Verificação a cada 60 s, ao voltar para a aba e ao reconectar, com `If-None-Match`: sem mudanças o GitHub responde 304, que não consome limite de uso.
- Alterações locais são agrupadas (2,5 s após a última, no máximo 15 s) e gravadas com o `sha` conhecido em uma única requisição; conflitos (409/422) disparam releitura, mescla e nova tentativa.
- Ao ocultar ou fechar a aba, alterações pendentes são enviadas com `keepalive`.
- Erros usam espera exponencial (até 5 min) e respeitam o limite de taxa informado pelo GitHub.
- Estado efêmero (timer em execução) não é enviado. Chaves de API da IA ficam só no navegador.
- No primeiro acesso de um dispositivo novo, o backup existente prevalece sobre os valores padrão recém-criados.

O estado da conta fica em `src/composables/useGitHubAccount.js`, o motor de sincronização em `src/utils/syncEngine.js`, as chamadas ao GitHub em `src/utils/githubSync.js`, a persistência e a mescla em `src/utils/storage.js`, o OAuth em `src/utils/oauth.js` e a recuperação de janelas em `src/utils/windowState.js`.

## Assistente IA

Funciona direto do navegador com a chave do próprio usuário: OpenAI, Anthropic (Claude, via SDK oficial), Google Gemini, Groq, OpenRouter, Mistral, DeepSeek, Ollama local e qualquer servidor compatível com `/chat/completions`. Respostas chegam em streaming, com botão de parar, cópia de blocos de código, lista de modelos obtida do provedor e instruções personalizadas. Nos modelos Claude compatíveis, o fallback do servidor em recusas (`fallbacks: "default"`) fica ativado.

## Validação

`npm test` cobre OAuth/PKCE, rejeição de callbacks inválidos, timestamps de persistência, mescla por chave, sincronização (envio único, 304 em ociosidade, mescla entre dispositivos), repos privados e recuperação de janelas corrompidas ou fora da tela. Os testes de autenticação usam respostas simuladas e não criam credenciais nem repositórios reais.
