# Flows oficiais v2

## Auditoria de partida

Antes desta fase, os seis Flows oficiais compartilhavam o mesmo onboarding de nome, categoria, foco e componentes. Metas e etapas estavam vazias, as métricas se limitavam a tempo e sessões, a revisão não tinha interface nem histórico e a home abria diretamente nas ferramentas. As tarefas iniciais mudavam, mas as respostas do usuário não criavam propriedades ou estrutura específica.

### Meu próximo passo: ENEM

- **Superficialidade encontrada:** checklist genérico, Pomodoro e notas sem plano de estudo, matérias, prática ou revisão de erros.
- **Componentes mantidos:** foco, checklist, notas, links e música.
- **Capacidade adicionada:** Tracker configurado para matérias, tópicos, questões, acertos, redações, simulados e revisões.
- **Onboarding:** prova, disponibilidade, duração, prioridades, confiança e metas semanais.
- **Metas e etapas:** horas, questões, redações e revisões; diagnóstico até simulados.
- **Progresso válido:** indicadores separados de tempo, questões, acerto, redações e simulados. Não há nota ou aprovação presumida.
- **UX específica:** a home começa por “o que estudar hoje” e usa matérias prioritárias e de menor confiança.

### Do código ao deploy

- **Superficialidade encontrada:** combinação de Kanban, snippets e playground sem escopo, estágio ou entrega.
- **Componentes mantidos:** Kanban, foco, snippets, notas, links, deploy e playground.
- **Capacidade adicionada:** Tracker de milestones, features, bugs e decisões; Kanban inicial configurado pelo Flow.
- **Onboarding:** nome, resultado da primeira versão, tipo, stack, estágio, repositório, prazo e funcionalidades essenciais.
- **Metas e etapas:** MVP, funcionalidades e primeira versão; ideia até iteração.
- **Progresso válido:** razão entre milestones concluídos e planejados somente quando existe denominador.
- **UX específica:** a home destaca o próximo incremento e o estágio declarado.

### Uma semana mais leve

- **Superficialidade encontrada:** checklist sem compromissos, prioridades, disponibilidade ou revisão semanal.
- **Componentes mantidos:** checklist e notas.
- **Capacidade adicionada:** Tracker leve com inbox, prioridades, semana, hoje, depois e concluído.
- **Onboarding:** início, compromissos, disponibilidade, até três prioridades, tempo protegido e hábito opcional.
- **Metas e etapas:** prioridades e revisão; estrutura semanal explícita.
- **Progresso válido:** prioridades e tarefas concluídas, além de semanas revisadas. Não existe pontuação de produtividade.
- **UX específica:** as três prioridades aparecem antes das ferramentas e o tom preserva espaço para imprevistos.

### Seu próximo capítulo

- **Superficialidade encontrada:** Kanban genérico e checklist sem oportunidade estruturada ou relação com o perfil desejado.
- **Componentes mantidos:** checklist, notas, links e foco.
- **Capacidade adicionada:** Tracker de oportunidades com empresa, cargo, URL, localização, modelo, salário, candidatura, contato, observações e próxima ação.
- **Onboarding:** cargo, senioridade, regiões, modelo de trabalho, meta semanal, urgência, salário e links profissionais.
- **Metas e etapas:** candidaturas da semana e base profissional; pipeline de encontrada até encerrada.
- **Progresso válido:** candidaturas, respostas, entrevistas, ofertas e taxa de retorno. O produto não estima distância até uma contratação.
- **UX específica:** cargo e meta semanal ficam visíveis; próximas ações usam as datas do pipeline.

### Faculdade em dia

- **Superficialidade encontrada:** o modelo representava um trabalho isolado, sem disciplinas ou calendário acadêmico.
- **Componentes mantidos:** checklist, foco, notas e links.
- **Capacidade adicionada:** Tracker de disciplinas, trabalhos, provas, leituras, referências e prazos.
- **Onboarding:** curso, semestre, disciplinas, datas e carga semanal.
- **Metas e etapas:** entregas, leituras e tempo de estudo; estrutura acadêmica completa.
- **Progresso válido:** itens realmente concluídos, sessões, tempo e prazos nos próximos 14 dias. Nenhum desempenho acadêmico é inferido.
- **UX específica:** a home ordena o que pede atenção pela data mais próxima.

### Do seu jeito

- **Superficialidade encontrada:** seleção de componentes sem objetivo, caminho, metas ou revisão configurável.
- **Componentes mantidos:** checklist e notas como ponto de partida mínimo.
- **Capacidade adicionada:** criação progressiva de objetivo, categoria, símbolo, cor, metas, etapas, indicadores e cadência.
- **Onboarding:** a primeira etapa é curta; toda estrutura avançada é opcional.
- **Progresso válido:** sessões, tempo e passos concluídos continuam disponíveis; indicadores personalizados começam em zero e não ganham valores inventados.
- **UX específica:** disclosure progressivo permite pular a configuração avançada.

## Novos pontos de partida

A mesma base suportou três definições adicionais sem componentes específicos: **Aprender uma habilidade**, **Criar conteúdo** e **Projeto pessoal**. Cada uma usa o Tracker configurável, perguntas próprias, metas, etapas e revisão contextual. O catálogo permanece limitado a nove opções oficiais.

## Regras de versão

As definições oficiais atuais usam `version: 2`. Toda instância registra `definitionRef.id` e `definitionRef.version`. Quando o catálogo contém uma versão maior, a home informa a disponibilidade e preserva a instância. Não existe atualização automática nem cópia de conteúdo do template para um Flow existente.

## Revisões

Cada definição fornece perguntas e cadência. A pessoa pode concluir, adiar por dois dias ou ignorar a ocorrência. Todas as ações entram em `review.history`; uma conclusão também atualiza `lastAt` e agenda `nextAt`. As respostas ficam somente na instância privada.
