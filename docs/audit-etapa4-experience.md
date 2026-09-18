# Auditoria da Etapa 4 — experiência do Flow

## Estado encontrado

O estado atual preserva bem a separação entre definição oficial, instância pessoal e dados de componentes. `model.js` cria instâncias versionadas e mantém `componentData`, `components`, `definitionRef`, `goals`, `stages`, `metrics`, `sessions`, `review` e `progress`. A migração por namespace de componente também mantém chaves legadas e suporta mais de uma instância do mesmo tipo.

O vazamento acontece na camada de apresentação:

- `Workspace.vue` é a experiência principal e, depois de `FlowHome`, monta uma sequência de painéis a partir de `activeComponents(active)`. O usuário encontra a arquitetura interna antes de encontrar o estado do objetivo.
- O cabeçalho do Flow oferece `+ Componentes`, e o seletor apresenta o catálogo de infraestrutura como decisão primária.
- `FlowHome.vue` recebe `getFlowHome()` e mostra `nextActions` como textos sem identidade, origem ou operações. Ações não podem abrir, concluir, adiar ou dispensar sua fonte.
- `runtime.js` calcula métricas e alguns próximos textos por definição, mas não produz uma lista estruturada de ações nem uma experiência composta por contexto, oportunidades, compromissos, preparação e histórico.
- `officialDefinitions.js` descreve componentes, trackers e métricas com precisão, porém esses dados chegam diretamente à grade. No Flow de carreira, empresa, status e próxima ação ficam visualmente confinados ao Tracker.
- `usePlatform.js` orquestra persistência, sessões, componentes e navegação no mesmo módulo. Ele ainda mantém ações rápidas antigas (`addTask`, `addLink`) e o estado de personalização junto da experiência principal.
- As ferramentas (`StructuredTracker`, `TasksTool`, `NotesTool`, `ResourcesTool`, `FocusTool`, Kanban e legado) já funcionam como capacidades reutilizáveis, mas sua montagem na Workspace faz seus nomes virarem a taxonomia do produto.
- `style.css` possui estilos de painéis, cabeçalhos de ferramenta e grade (`workspace-grid`, `tool-panel`, `legacy-tool`) que reforçam a percepção de coleção de caixas. Os tokens em `src/design/tokens.css` e os componentes UI permitem uma superfície contínua sem trocar a identidade visual.
- Os testes atuais validam criação, persistência, migração, ferramentas e sessões, mas o principal fluxo de carreira ainda verifica o Tracker e a sessão. Não há teste para uma ação estruturada com origem, operação e atualização contextual.

## Direção adotada

```text
Flow Definition
    ↓ cria
Flow Instance
    ↓ expõe dados por
Capabilities / primitives
    ↓ consumidos por
Flow Experience
```

Capabilities continuam sendo `componentData`, componentes, Tracker, Tarefas, Notas, Recursos, Focus, Kanban e ferramentas legadas. A nova camada de experiência somente lê essas fontes, deriva estado e aponta de volta para o registro real. A primeira experiência especializada será a busca de carreira; os demais Flows recebem uma composição genérica segura até suas reconstruções.

## Dívida conhecida antes da etapa

- Ainda há uma sessão global de foco no rodapé do Workspace, embora tempo não seja uma unidade universal de progresso.
- Algumas definições oficiais continuam usando Tracker como principal fonte de métricas e precisarão de uma experiência própria na próxima etapa.
- O histórico atual privilegia sessões; mudanças de pipeline e ações concluídas ainda precisam de uma trilha de eventos mais rica.
- A área secundária de personalização ainda monta ferramentas legadas e precisa de revisão visual depois que a experiência principal estiver estável.
- A execução de ações deve preservar os campos antigos e será ampliada para recorrência, automações e mais tipos de fonte em etapas posteriores.
