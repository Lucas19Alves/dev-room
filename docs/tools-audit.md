# Auditoria das ferramentas universais

## Critérios

Cada ferramenta foi avaliada por utilidade recorrente, integração com o modelo de Flow, qualidade atual, sobreposição, custo de manutenção e coerência com o Noma. A classificação orienta arquitetura e prioridade; ela não remove ferramentas do produto.

| Ferramenta | Classe | Situação encontrada | Direção |
| --- | --- | --- | --- |
| Focus/Pomodoro | Core | Timer regressivo acoplado ao `Workspace`, com estado por tipo e sobreposição parcial com a sessão geral | Tratar Focus como capacidade de dedicação; sessão livre e Pomodoro compartilham o motor temporal e alimentam `sessions` |
| Checklist | Core | Entrada rápida boa, mas apenas título, conclusão e grupo informal | Evoluir para Tasks com detalhes opcionais habilitados por configuração |
| Tracker | Core | Boa base estruturada, porém sem busca, filtro, ordenação ou todos os tipos de campo declarados | Manter como registro estruturado; adicionar controles genéricos e campos seguros |
| Notas | Core | Um único campo de texto por Flow | Criar notas múltiplas em Markdown simples, pesquisáveis e fixáveis |
| Links | Core | URL e título apenas | Evoluir para Recursos com descrição, categorias, tags, favorito e hostname |
| Música | Especializada | Player consistente e útil para alguns contextos, mas sem relação com sessões | Preservar como apoio ambiental e migrar seu armazenamento para `component.id` |
| Kanban | Especializada | Cards visuais com drag-and-drop e alternativa por select, mas poucos metadados | Diferenciar do Tracker: trabalho visual, ordem, prioridade, prazo, tags e vínculos |
| Snippets | Especializada | Útil em Flows técnicos, com boa busca e edição | Preservar e migrar namespace; configuração futura pode limitar linguagens |
| Playground | Especializada | Útil para experimentação web, isolado por sandbox | Preservar e migrar namespace; não transformar em IDE |
| Conversor | Legada/questionável | Conversão monetária externa e pouco relacionada à maioria dos objetivos | Manter opcional; explicitar dependência online e migrar namespace |
| Hidratação | Especializada | Apoio de bem-estar com lembretes locais | Manter opcional; não transformar em gamificação de saúde |
| Checklist de deploy | Especializada | Bom roteiro técnico, mas sobrepõe Tasks quando não há configuração | Manter para validação de entrega e migrar namespace; futura etapa pode usar presets |
| Dados de teste | Legada/questionável | Herdado do Dev Room, útil apenas em desenvolvimento e prototipação | Manter como ferramenta técnica opcional, fora dos Flows gerais |
| Cronômetro | Legada/questionável | Contagem regressiva independente semelhante ao Pomodoro | Preservar o caso de timer utilitário; compartilhar cálculos temporais com Focus |

## Limites entre capacidades

- **Tasks** representa compromissos executáveis, com conclusão e detalhes opcionais.
- **Tracker** representa entidades estruturadas que percorrem estados, como oportunidades ou entregas acadêmicas.
- **Kanban** representa trabalho visual em cards ordenados por coluna.
- **Focus** registra dedicação ao Flow, tarefa, meta ou etapa.
- **Cronômetro** continua sendo um timer utilitário que não cria uma sessão de dedicação por conta própria.

## Problema transversal

O armazenamento ainda usa chaves equivalentes a `component.type`. Isso funciona enquanto existe apenas uma instância de cada ferramenta, mas torna duas Tasks ou dois Trackers ambíguos. A migração desta fase passa a resolver dados pelo `component.id`, mantendo leitura compatível do namespace antigo. Renderização continua sendo escolhida por `component.type`.

## Prioridade de implementação

1. Namespace por instância e migração de leitura.
2. Extração das ferramentas core do `Workspace`.
3. Tasks, Focus, Notas e Recursos configuráveis.
4. Tracker e Kanban maduros.
5. Vínculos com goals, stages, métricas e sessões.
6. Migração das ferramentas especializadas e legadas para o mesmo contrato de armazenamento.
