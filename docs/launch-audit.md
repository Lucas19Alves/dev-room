# Auditoria de lançamento — 19/09/2026

Base auditada: commit `f726d54`, antes das alterações de lançamento. Leitura distribuída entre domínio, Builder/renderer, backend e interface. A implementação da etapa anterior estava incompleta apesar do commit: o Builder existia mas não era usado na criação.

## Evidência de uso

Executada a aplicação local em Chromium (1440×900 e 360×800). Criado Flow, finalizado onboarding, escrita nota, recarregada página e confirmado conteúdo. Screenshots de auditoria em `test-results/audit-*.png` (artefatos locais). A URL local 5180 estava indisponível; usado servidor 5179 em modo de testes isolado. Acessar o site público será verificado novamente no QA.

Baseline: 15/16 testes unitários passam. O teste de experiências oficiais já falha por divergência entre experiência declarativa e contrato anterior. Não será removido; os mesmos comportamentos serão verificados no contrato final.

## Problemas prioritários

- BLOCKER: campos oficiais usam `id`, mas comandos/formulários leem apenas `key`; gravações podem falhar ou perder valores.
- BLOCKER: concluir follow-up encerra a entidade; regras reaplicam prazos ao editar e não há transações de comandos/regras idempotentes.
- BLOCKER: grants de escrita direta contornam compare-and-swap de sincronização; carregar nuvem descarta trabalho local sem cópia automática.
- BLOCKER: não existem subscriptions, autorização de plano no servidor, checkout, webhook ou exclusão de conta.
- HIGH: Builder não está integrado, quebra ao escolher preset, não permite regras úteis nem múltiplas coleções; preview não representa uso real.
- HIGH: validação de template é superficial; não limita payload nem verifica referências/efeitos com rigor.
- HIGH: landing vende widgets, ferramentas e tempo. Jornada mede sessões apenas. Hoje/calendário inexistentes.
- HIGH: PWA só tem manifest e ícones duplicados de 2000px; não existe offline shell/service worker.
- MEDIUM: textos de infraestrutura aparecem na conta e comunidade, tipografia abaixo de 12px, formulários longos e excesso de caixas.
- MEDIUM: todos os MP3 permanecem em public, sem política de cache explícita; scripts do playground exigem sandbox separado.

## Direção de implementação

1. Consolidar contrato declarativo, comandos e consequências; adaptar dados legados sem excluir fontes.
2. Builder e renderer genéricos, com Carreira/ENEM como definições e exemplos professor/casamento/violão nos testes.
3. Hoje, Jornada e calendário derivados das mesmas fontes; arquivamento preservando dados.
4. Sync e backend protegidos, entitlements centrais, pagamentos somente via servidor.
5. Revisar linguagem, navegação, acessibilidade, landing, mobile, PWA e privacidade; medir e testar novamente.

## Decisões já recebidas

Operação: App na Manga, Brasil, appnamanga@gmail.com. Pro: R$19/mês e R$190/ano (dois meses de economia). Ainda não existe conta Stripe. Ativação live e publicação não serão simuladas: exigem credenciais e validação de infraestrutura antes do lançamento.
