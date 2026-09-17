# Auditoria da fase de maturação

## Situação encontrada

- A aplicação já possuía landing page, autenticação Supabase, shell de Flows, snapshots IndexedDB e sincronização otimista.
- Configuração do Flow, dados privados e sessões dividiam o mesmo objeto genérico `data`.
- Ferramentas antigas compartilhavam uma ponte global e várias ainda usavam o visual escuro do produto anterior.
- Havia componentes mortos, ícones e textos da identidade anterior, além de dependências usadas apenas por esse código.
- Os testes E2E ainda descreviam acesso direto sem login e o formato antigo dos Flows.
- O banco remoto separava snapshots privados de modelos públicos e já tinha RLS, mas a tabela pública não distinguia rascunho, publicação e arquivamento.

## Decisões desta fase

- O nome do produto e todos os textos ativos passam a usar Noma.
- O Flow v2 usa um contrato explícito, com migração de leitura e sem exclusão da origem local.
- IndexedDB continua sendo a primeira gravação; Supabase continua sendo conta e sincronização cloud.
- O snapshot de conta continua atômico nesta fase para não introduzir uma migração remota destrutiva antes da reconstrução dos Flows oficiais.
- Conteúdo público contém somente definição e configuração. Conteúdo pessoal fica na instância privada.
- Ferramentas usam namespaces por componente e um sistema visual comum.

## Dívida técnica conhecida

- A sincronização ainda ocorre por snapshot completo da conta, limitado a 5 MB. Flows grandes precisarão de sincronização granular.
- O conflito é tratado por conta inteira; ainda não há merge por Flow ou por componente.
- O manifest existe, mas não há service worker para reabrir o app offline após limpar o cache HTTP.
- Áudios enviados pelo usuário usam URLs temporárias do navegador e não sobrevivem a uma nova sessão.
- O conversor depende de uma API externa para novas cotações e mantém apenas o último resultado.
- Modelos oficiais ainda são empacotados no frontend; a próxima fase deve versioná-los e testar migrações específicas por modelo.
- A rota manual é suficiente para o escopo atual, mas guardas e páginas adicionais podem justificar um roteador dedicado depois.

## Decisões pendentes

- Aplicar ao projeto remoto a migração `202609170001_flow_definition_v2.sql`, que adiciona versão e status aos modelos públicos e restringe leitura anônima aos publicados.
- Definir se áudios enviados devem ficar apenas no dispositivo ou usar Supabase Storage com quota e política de retenção.
- Escolher a estratégia futura de sincronização granular: tabela por entidade, log de operações ou snapshots por Flow.
