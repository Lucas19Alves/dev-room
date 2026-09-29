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

As ferramentas salvam no navegador. Com uma conta conectada, o backup usa `dev-room-data/dev-room-data.json` no GitHub, somente em repositório privado. Uma sincronização por vez compara a data das alterações; a versão mais recente vence. Falhas preservam os dados locais e são repetidas. Alterações simultâneas em dispositivos diferentes não são mescladas campo a campo.

As chaves antigas de armazenamento foram preservadas para manter os dados existentes. O estado da conta fica em `src/composables/useGitHubAccount.js`, o OAuth em `src/utils/oauth.js`, a persistência em `src/utils/storage.js` e a recuperação de janelas em `src/utils/windowState.js`.

## Validação

`npm test` cobre OAuth/PKCE, rejeição de callbacks inválidos, timestamps de persistência, repos privados e recuperação de janelas corrompidas ou fora da tela. Os testes de autenticação usam respostas simuladas e não criam credenciais nem repositórios reais.
