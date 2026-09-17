# Arquitetura do Noma

## Limites do produto

O Noma é organizado em três camadas. A interface apresenta descoberta, criação, uso e histórico. O domínio define modelos de Flow, instâncias pessoais e dados de componentes. A persistência mantém uma cópia imediata no navegador e sincroniza a conta autenticada com o Supabase.

## Flow v2

Uma definição (`flow_definition`) descreve um ponto de partida público e versionado. Ela pode conter objetivo, descrição, onboarding, propriedades, metas, etapas, tipos de componente, configuração inicial, definições de métricas, instruções e revisão periódica. Ela nunca contém tarefas, notas, links, sessões ou respostas pessoais.

Uma instância (`flow_instance`) pertence ao usuário. O formato atual usa `schemaVersion: 2` e separa:

- `definitionRef`: origem e versão do modelo;
- `identity`: nome, categoria, cor e ícone da instância;
- `objective` e `description`;
- `onboarding` e respostas pessoais;
- `properties`, `goals` e `stages`;
- `components`: composição, ordem e configuração;
- `componentData`: conteúdo privado isolado por tipo de componente;
- `metricDefinitions`, `metrics` e `progress`;
- `sessions`;
- `context` e `review`;
- `privacy`.

`src/flow/model.js` é a fronteira desse contrato. Contas antigas são normalizadas em memória antes de entrar no store. A migração preserva IDs, datas, tarefas, notas, links, duração de foco, sessões e dados das ferramentas conhecidas.

## Persistência

| Dado | IndexedDB | Supabase | Público |
| --- | --- | --- | --- |
| Conta e preferências | cópia imediata | `flow_accounts.payload` | não |
| Instâncias pessoais | cópia imediata | snapshot privado da conta | não |
| Dados dos componentes | dentro da instância | snapshot privado da conta | não |
| Sessões e progresso | dentro da instância | snapshot privado da conta | não |
| Definições oficiais | bundle da aplicação | futura distribuição versionada | sim |
| Definições da comunidade | cache em memória | `flow_templates.blueprint` | quando publicadas |

O IndexedDB do Noma usa o banco `noma` e o object store `accounts`. Na primeira abertura, se estiver vazio, procura outro banco local com um store `accounts` e envelopes compatíveis, copia os registros e preserva a origem. A migração antiga de `localStorage` também detecta o formato do conteúdo em vez de depender do nome histórico da chave.

Contas autenticadas usam compare-and-swap por revisão na função `save_flow_account`. Um conflito interrompe novos envios e oferece exportação local antes de carregar a versão da nuvem. RLS limita snapshots ao proprietário; modelos públicos ficam em tabela separada.

## Ferramentas

Ferramentas recebem um namespace próprio via `useFlowComponentStorage(type, fallback)`. O composable grava somente em `flow.componentData[type]`. Remover um componente da composição não remove seu conteúdo, por isso adicioná-lo novamente recupera o estado anterior.

As ferramentas nativas (`focus`, `tasks`, `notes`, `links`) usam o mesmo mapa de dados. As demais são carregadas sob demanda para limitar o bundle inicial.

## Rotas e autenticação

`App.vue` controla as rotas públicas e privadas sem um roteador externo. `/` é a apresentação pública; `/login`, `/signup`, `/forgot-password` e `/reset-password` tratam autenticação; `/app` exige sessão. A chave publishable é a única credencial permitida no cliente.
