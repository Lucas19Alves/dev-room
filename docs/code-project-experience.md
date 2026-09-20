# Experiência de execução — Do código ao deploy

A experiência separa três momentos, sem alterar o modelo persistido:

- **Agora:** retomada do último trabalho, passo executável, pendências relevantes e captura rápida.
- **Plano:** roadmap com filtros, criação de etapas e funcionalidades, bloqueios, decisões e replanejamento de datas.
- **Evolução:** progresso real, entregas concluídas, métricas de sessões e projeção determinística existente.

Etapas e formulários abrem em um diálogo modal nativo. Dentro de cada etapa, **Executar** reúne checklist e foco; **Contexto** reúne notas, links e código; **Ajustes** reúne prazo, tamanho e estado. Código e experimentos ficam em uma seção expansível.

As abas e filtros são estado local da apresentação. `projectFlow.js` continua responsável pelas transições, projeção e dados em `componentData.codeProject`. O evento `change` mantém o caminho existente de persistência.

O workspace usa o schema 3 e migra instâncias anteriores sem apagar dados. `declaredInitialStage` preserva o momento informado no onboarding; `derivedStage` acompanha automaticamente o foco e os passos realizados. O ponto inicial também recorta o plano automático, sem marcar trabalho anterior como concluído.

Passos automáticos recebem checklists compostos deterministicamente pelo objetivo, tipo de projeto, tipo do passo e tecnologias escolhidas. Tamanhos Pequena, Média ou Grande são convertidos em sessões planejadas. Funcionalidades mantêm os checkpoints Planejar → Implementar → Validar → Integrar e ganham verificações próprias da área e do contexto técnico. Dependências pendentes não viram impedimentos, mas retiram o passo das recomendações até serem concluídas.

`projectResumeContext()` combina eventos de execução e sessões para recuperar o último passo realmente trabalhado. Concluir, bloquear, desbloquear, registrar decisão, replanejar e iniciar foco ficam disponíveis em **Agora**; o diálogo é reservado para checklist, notas, links e código.

O contexto do projeto pode ser editado sem reconstruir o roadmap. Mudanças em objetivo, tipo ou tecnologias criam apenas `pathReview.pending`; os passos só são revistos quando a pessoa escolhe fazê-lo. Capturas rápidas guardam ideias no contexto e transformam passos ou bugs em trabalho pequeno próximo ao foco atual.

Quando todos os passos principais foram concluídos ou dispensados, `projectCompletionSummary()` reúne entregas, decisões, sessões, tempo e pendências opcionais. A pessoa pode encerrar a versão, continuar evoluindo ou iniciar uma nova versão sem apagar o histórico anterior.

A projeção só apresenta uma data quando há ao menos três sessões distribuídas por sete dias. Ela combina sessões restantes com o ritmo semanal observado; sem histórico suficiente, informa apenas as sessões planejadas. O calendário global recebe início, data-alvo, passos, funcionalidades e decisões datadas diretamente de `componentData.codeProject`.

O diálogo oferece isolamento do fundo, Escape, contenção de Tab/Shift+Tab, retorno ao acionador e bloqueio de rolagem. Ao encerrar uma sessão, ele fecha para permitir a abertura do resumo global. As abas suportam setas, Home e End.

A jornada Playwright cobre criação, checklist, notas, sessão, conclusão, evolução, recarga, teclado e largura mobile. Capturas são geradas em `test-results/code-project-*`.

Dívida restante: extrair os editores da etapa para componentes menores e substituir os alertas de validação existentes por feedback inline. A projeção permanece limitada à quantidade de histórico disponível, sem inventar datas.
