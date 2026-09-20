# Experiência de execução — Do código ao deploy

A experiência separa três momentos, sem alterar o modelo persistido:

- **Agora:** etapa em foco, próximo passo, resultado desejado e resumo de pendências.
- **Plano:** roadmap com filtros, criação de etapas e funcionalidades, bloqueios, decisões e replanejamento de datas.
- **Evolução:** progresso real, entregas concluídas, métricas de sessões e projeção determinística existente.

Etapas e formulários abrem em um diálogo modal nativo. Dentro de cada etapa, **Executar** reúne checklist e foco; **Contexto** reúne notas, links e código; **Ajustes** reúne prazo, tamanho e estado. Código e experimentos ficam em uma seção expansível.

As abas e filtros são estado local da apresentação. `projectFlow.js` continua responsável pelas transições, projeção e dados em `componentData.codeProject`. O evento `change` mantém o caminho existente de persistência. Não há migração de dados nesta reorganização.

O diálogo oferece isolamento do fundo, Escape, contenção de Tab/Shift+Tab, retorno ao acionador e bloqueio de rolagem. Ao encerrar uma sessão, ele fecha para permitir a abertura do resumo global. As abas suportam setas, Home e End.

A jornada Playwright cobre criação, checklist, notas, sessão, conclusão, evolução, recarga, teclado e largura mobile. Capturas são geradas em `test-results/code-project-*`.

Dívida restante: extrair os editores da etapa para componentes menores e substituir os alertas de validação existentes por feedback inline. A projeção permanece limitada à quantidade de histórico disponível, sem inventar datas.
