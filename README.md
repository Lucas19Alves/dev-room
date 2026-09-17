# Noma

O Noma transforma um objetivo em um **Flow** preparado para execução. Cada Flow reúne contexto, componentes, metas, etapas, sessões e histórico de progresso sem perder a experiência local imediata.

## Desenvolvimento

Requisitos: Node.js 22.13 ou mais recente.

```bash
npm install
npm run dev
```

Crie `.env.local` a partir de `.env.example` e informe somente a URL e a chave pública/publishable do Supabase. Nunca use `service_role` no frontend.

## Verificação

```bash
npm run format
npm test
npm run test:e2e
npm run build
```

Os testes E2E usam `.env.e2e` para uma sessão local sintética. Esse modo não é ativado em builds normais.

## Arquitetura

- [Arquitetura e persistência](docs/architecture.md)
- [Auditoria da fase de maturação](docs/audit.md)
- [Design System interno](docs/design-system.md)

As migrações do banco ficam em `supabase/migrations`. Elas devem ser revisadas e aplicadas ao projeto Supabase de forma explícita; o build do frontend não executa migrações.
