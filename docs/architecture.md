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

`src/flow/officialDefinitions.js` contém definições oficiais serializáveis e versionadas. `src/flow/setup.js` transforma respostas de onboarding em propriedades, metas, etapas e dados iniciais. `src/flow/runtime.js` calcula indicadores a partir das fontes privadas, atualiza metas derivadas, produz o contexto legado e registra revisões. `src/flow/experience.js` transforma esse estado em seções e ações estruturadas, enquanto os componentes de experiência somente renderizam e emitem intenções. Essa separação impede que uma definição pública receba conteúdo pessoal e evita regras de domínio espalhadas pelo Vue.

Uma instância nunca acompanha silenciosamente a versão mais nova de uma definição. O catálogo compara versões e apresenta apenas um aviso. A atualização automática permanece proibida porque componentes, propriedades e conteúdo podem ter sido personalizados.

## Camada de experiência e Action Engine

O Flow não é apresentado como um workspace de ferramentas. A composição interna continua existindo, mas a interface de uso segue este fluxo:

```text
Flow Definition → Flow Instance → Capabilities / primitives → Flow Experience
```

`src/flow/experience.js` deriva uma leitura pronta para apresentação a partir das mesmas fontes. Ela consome Tracker, Tarefas, Recursos, Notas, metas, etapas, métricas, sessões e revisão sem copiar o conteúdo para um segundo banco de dados. A composição visual é escolhida por `src/flow/experienceRegistry.js`, que associa cada definição a uma experiência: `JobExperience`, `StudyExperience`, `ProjectExperience`, `CollegeExperience`, `WeekExperience`, `SkillExperience`, `ContentExperience` ou `GenericExperience`. Assim, a definição continua sendo dados e o componente decide apenas como apresentar o estado derivado.

As experiências oficiais não compartilham uma grade de painéis. Carreira mantém pipeline e follow-ups; ENEM organiza Hoje, Plano, Prática, Revisar e Evolução; Projeto separa incremento, andamento, roadmap, bloqueios, decisões e release; Faculdade prioriza prazos e disciplinas; Semana usa uma sequência curta de prioridades; Habilidade apresenta trilha e registro de prática; Conteúdo apresenta pipeline editorial. `GenericExperience` atende instâncias personalizadas sem reabrir o grid de widgets. Primitives como `ExperienceActionList` e `ExperienceItems` compartilham acessibilidade, estados vazios e controles, mas a composição permanece específica.

O mesmo módulo contém o Action Engine determinístico. Cada ação tem `id`, `type`, `title`, `description`, `priority`, `dueAt`, `source`, `sourceId`, `flowId` e operações possíveis. A origem permanece sendo o registro real do componente. `usePlatform.executeAction()` aplica `open`, `complete`, `postpone` e `dismiss` na fonte, recalcula o runtime e grava pelo mesmo caminho offline-first. Não há contadores paralelos nem geração por IA.

Ferramentas aparecem apenas em `Personalizar Flow`, uma área secundária para quem precisa ajustar capacidades. O uso normal não precisa conhecer `components`, `tools`, Tracker, Tasks ou Notes.

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

Ferramentas recebem um namespace próprio via `useFlowComponentStorage(componentId, fallback, legacyType)`. O composable grava em `flow.componentData[componentId]`; registros antigos por tipo continuam sendo lidos por uma migração compatível e nunca são apagados. Remover um componente da composição não remove seu conteúdo, por isso adicioná-lo novamente recupera o estado anterior. Duas instâncias do mesmo tipo podem manter dados independentes.

O Tracker estruturado é um componente universal configurado pela definição do Flow. A configuração declara nome, etapas e campos; os registros continuam em `componentData.tracker`. Carreira, estudo, projetos, semana e faculdade compartilham a mesma implementação e oferecem mudança de etapa por `select`, o que mantém o uso por teclado e em telas de toque.

As ferramentas nativas (`focus`, `tasks`, `notes`, `links`) usam o mesmo mapa de dados. As demais são carregadas sob demanda para limitar o bundle inicial.

Métricas são descrições de leitura, não contadores paralelos. O runtime deriva valores de sessões, tarefas, revisões, Kanban e Tracker. Uma porcentagem única só aparece quando existe uma razão defensável, como milestones concluídos sobre milestones planejados. Busca de emprego, ENEM, faculdade e semana mostram indicadores separados.

## Rotas e autenticação

`App.vue` controla as rotas públicas e privadas sem um roteador externo. `/` é a apresentação pública; `/login`, `/signup`, `/forgot-password` e `/reset-password` tratam autenticação; `/app` exige sessão. A chave publishable é a única credencial permitida no cliente.
