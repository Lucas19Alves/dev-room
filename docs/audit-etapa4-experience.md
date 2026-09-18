# Auditoria da Etapa 4 — experiência do Flow

## Estado encontrado

O estado atual preserva bem a separação entre definição oficial, instância pessoal e dados de componentes. `model.js` cria instâncias versionadas e mantém `componentData`, `components`, `definitionRef`, `goals`, `stages`, `metrics`, `sessions`, `review` e `progress`. A migração por namespace de componente também mantém chaves legadas e suporta mais de uma instância do mesmo tipo.

O vazamento acontecia na camada de apresentação:

- `Workspace.vue` é a experiência principal e, depois de `FlowHome`, monta uma sequência de painéis a partir de `activeComponents(active)`. O usuário encontra a arquitetura interna antes de encontrar o estado do objetivo.
- O cabeçalho do Flow oferece `+ Componentes`, e o seletor apresenta o catálogo de infraestrutura como decisão primária.
- `FlowHome.vue` recebe `getFlowHome()` e mostra `nextActions` como textos sem identidade, origem ou operações. Ações não podem abrir, concluir, adiar ou dispensar sua fonte.
- `runtime.js` calcula métricas e alguns próximos textos por definição, mas não produz uma lista estruturada de ações nem uma experiência composta por contexto, oportunidades, compromissos, preparação e histórico.
- `officialDefinitions.js` descreve componentes, trackers e métricas com precisão, porém esses dados chegam diretamente à grade. No Flow de carreira, empresa, status e próxima ação ficam visualmente confinados ao Tracker.
- `usePlatform.js` orquestra persistência, sessões, componentes e navegação no mesmo módulo. Ele ainda mantém ações rápidas antigas (`addTask`, `addLink`) e o estado de personalização junto da experiência principal.
- As ferramentas (`StructuredTracker`, `TasksTool`, `NotesTool`, `ResourcesTool`, `FocusTool`, Kanban e legado) já funcionam como capacidades reutilizáveis, mas sua montagem na Workspace faz seus nomes virarem a taxonomia do produto.
- `style.css` possui estilos de painéis, cabeçalhos de ferramenta e grade (`workspace-grid`, `tool-panel`, `legacy-tool`) que reforçam a percepção de coleção de caixas. Os tokens em `src/design/tokens.css` e os componentes UI permitem uma superfície contínua sem trocar a identidade visual.
- Os testes anteriores validavam criação, persistência, migração, ferramentas e sessões, mas o principal fluxo de carreira ainda verificava o Tracker e a sessão. Também faltava uma jornada para ação estruturada com origem, operação e atualização contextual.

## Implementação desta etapa

O registry em `src/flow/experienceRegistry.js` remove a seleção por condicionais do `Workspace.vue`. O Workspace agora monta o componente retornado pelo registry e passa apenas a instância, o estado derivado e os comandos de persistência. `JobExperience` preserva a jornada de carreira que já estava validada; os demais componentes receberam composições próprias para impedir que a interface volte a ser uma grade de ferramentas.

`experience.js` continua sendo a fronteira de derivação para esta etapa: normaliza itens de capacidades, cria seções específicas por definição e gera ações estruturadas com origem, prioridade e operações. A conclusão de uma ação altera o item persistido e o runtime recalcula métricas, metas e progresso. Nenhum dado foi movido para uma store paralela.

As jornadas E2E agora cobrem os oito pontos de partida oficiais além da jornada de carreira existente. O teste cria cada Flow pelo onboarding, entra na experiência e verifica um título de domínio diferente; o teste unitário confere as seções e tipos de ação derivados de cada definição.

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

Capabilities continuam sendo `componentData`, componentes, Tracker, Tarefas, Notas, Recursos, Focus, Kanban e ferramentas legadas. A camada de experiência somente lê essas fontes, deriva estado e aponta de volta para o registro real. Cada Flow oficial tem agora uma composição própria; o modo personalizado usa o fallback genérico.

## Dívida técnica restante

- Ainda há uma sessão global de foco no rodapé do Workspace, embora tempo não seja uma unidade universal de progresso.
- As experiências específicas ainda dependem de um vocabulário comum de registros; Flows futuros precisarão declarar capacidades e eventos de domínio mais ricos sem transformar o Tracker em contrato universal.
- O histórico atual privilegia sessões; mudanças de pipeline e ações concluídas ainda precisam de uma trilha de eventos mais rica.
- A área secundária de personalização ainda monta ferramentas legadas e precisa de revisão visual e busca por capacidade antes de crescer o catálogo.
- A execução de ações preserva os campos antigos, mas ainda precisa de uma camada de comandos formal para recorrência, automações, eventos de histórico e mais tipos de fonte.
