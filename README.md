# CentralOS 2 — Encontre seu Flow

Uma plataforma de espaços de trabalho orientados a objetivos. O usuário escolhe um modelo, define o objetivo, seleciona os componentes e entra em um **Flow** com conteúdo e histórico próprios.

## Executar

Use Node.js 22.13+ e npm.

```sh
npm ci
npm run dev
```

Sem variáveis de ambiente, o CentralOS funciona em modo local. Os Flows são persistidos em IndexedDB; contas e comunidade mostram um estado indisponível até a configuração do Supabase.

```sh
npm run build
npm run preview
npm test
npm run test:e2e
```

Na primeira execução dos testes de navegador, execute `npx playwright install chromium`.

## Experiência

- Descoberta com busca e categorias: ENEM, programação, organização semanal, carreira, faculdade e criação do zero.
- Configuração em três etapas: propósito, componentes e revisão/perfil.
- Flows independentes com nome editável, adição, remoção e reordenação de componentes. Remover um componente preserva o conteúdo.
- Pomodoro configurável, checklist, notas e links próprios de cada Flow; ferramentas existentes de música, Kanban, snippets, playground, conversão, hidratação, deploy, dados de teste e temporizador.
- Sessão com início, pausa, retomada e conclusão; histórico, Flow Map dos últimos 364 dias e cartão PNG para download.
- Conta com link de acesso por e-mail, sincronização privada e importação explícita dos Flows locais.
- Modelos públicos compartilháveis por `?flow=<uuid>`, com retirada da publicação pelo autor. Publicar inclui somente nome, categoria, componentes e duração do foco. Conteúdo e histórico pessoais não são copiados.

## Ativar Supabase

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/202609160001_flow_platform.sql` no SQL Editor do projeto (uma vez). Alternativamente, use a CLI Supabase para aplicar a migração.
3. Copie `.env.example` para `.env.local` e informe:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

A chave legada `VITE_SUPABASE_ANON_KEY` também é aceita. **Não use service_role no frontend.**

4. Em Authentication → URL Configuration, configure a Site URL de produção e autorize a URL local, por exemplo `http://localhost:5173`, nas Redirect URLs. Ative o provedor de e-mail; configure SMTP para entrega em produção.
5. Reinicie o Vite (ou reconstrua o bundle em produção). Em “Conta”, solicite o link de acesso. Confirme o e-mail e use “Importar meus Flows deste dispositivo” se quiser levar os dados locais para a conta.
6. Valide com duas contas reais: dados privados isolados, publicação/remoção de modelo, link compartilhado, logout e reconexão após trabalho offline.

Documentação oficial: [acesso por e-mail](https://supabase.com/docs/guides/auth/auth-email-passwordless) e [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

As credenciais não foram fornecidas e nenhum projeto remoto foi criado ou alterado por esta implementação. O login por e-mail e a sincronização hospedada precisam desse teste após configuração.

## Divisão do armazenamento

| Camada                         | Conteúdo                                                                                                                                        | Motivo                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| IndexedDB `centralos/accounts` | Estado local completo, conteúdo dos componentes, sessões, revisão remota e marcador de alterações pendentes; um registro por conta ou visitante | Persistência local e retomada mesmo quando a nuvem está indisponível          |
| Supabase Auth                  | Identidade e sessão de acesso                                                                                                                   | Login e autorização                                                           |
| Supabase `flow_accounts`       | Snapshot privado de cada conta e revisão monotônica                                                                                             | Sincronização entre dispositivos protegida por RLS e controle de concorrência |
| Supabase `flow_templates`      | Configurações públicas, autor e data                                                                                                            | Descoberta e compartilhamento sem conteúdo privado                            |
| localStorage                   | Sessão gerenciada pelo SDK Supabase e dados antigos preservados para recuperação                                                                | Compatibilidade; não recebe novos dados de trabalho                           |

O repositório original desta revisão usava **localStorage**, não IndexedDB. A primeira abertura migra `dev-room-data` para um Flow chamado “Meu espaço anterior”. A origem é mantida e o processo não se repete quando o registro local já existe. Os tokens antigos de GitHub deixam de ser usados. O cliente Octokit, o callback OAuth e o sincronizador de repositório foram removidos; nenhum repositório remoto é apagado.

A gravação local é serializada e indica quando terminou. Uma trava Web Locks impede duas abas de editarem o mesmo banco simultaneamente. A sincronização roda após alterações, ao reconectar e a cada 30 segundos. A função SQL faz uma comparação atômica da revisão: se outro dispositivo gravou antes, a cópia local é preservada e a interface oferece exportação antes de carregar a versão remota. Não há sobrescrita silenciosa nem promessa de edição colaborativa em tempo real.

Os dados do visitante e das contas são separados. Sair não apaga o cache da conta, mas o modo visitante não o apresenta; trata-se de persistência do navegador, sem criptografia local. Áudios enviados pelo componente musical continuam temporários em memória e não são sincronizados.

## Arquitetura

- `src/App.vue`: shell, telas, editor e diálogos.
- `src/flow/usePlatform.js`: navegação, criação, sessões, componentes e publicação.
- `src/flow/catalog.js`: catálogo, construção de Flows e projeção pública que exclui dados privados.
- `src/flow/store.js`: conta ativa, migração, persistência e sincronização com revisão.
- `src/flow/database.js`: IndexedDB.
- `src/flow/supabase.js`: cliente opcional configurado por ambiente.
- `src/utils/storage.js`: adaptação das ferramentas existentes ao Flow aberto.
- `supabase/migrations/`: esquema, políticas e função atômica.

O snapshot privado é limitado a 5 MB por conta nesta versão. A comunidade carrega os 100 modelos mais recentes. Para evolução em grande escala, particione conteúdo por Flow/componente, acrescente paginação, cotas, moderação de publicações e telemetria operacional. Não há IA generativa, avaliações ou métricas de uso inventadas. O mapa e os cartões usam apenas sessões concluídas pelo usuário.

## Validação

`npm test` cobre isolamento de instâncias, exclusão de conteúdo privado dos modelos, URLs seguras, persistência por conta e execução real da migração em PostgreSQL via PGlite, incluindo RLS e conflito de revisão.

`npm run test:e2e` cobre criação/personalização, tarefas, notas, separação entre Flows, recarga, migração legada, download do cartão, viewport móvel, retomada do Pomodoro, componentes existentes e proteção contra abas concorrentes. Os testes usam contextos de navegador isolados e não alteram dados pessoais.

## Docker

```sh
docker compose up --build
```

Acesse `http://localhost:5173`. As variáveis públicas do Supabase entram no build; recrie a imagem quando elas mudarem. Configure-as no ambiente do terminal ou em um arquivo `.env` usado pelo Compose.
