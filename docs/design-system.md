# Design System interno

Os tokens em `src/design/tokens.css` são a fonte para cores, superfícies, bordas, raios, espaçamento, sombras, altura de controles, foco e transições. Eles preservam a identidade editorial verde já existente.

Componentes reutilizáveis em `src/components/ui`:

- `BrandLogo`: assinatura e marca compacta;
- `NButton`: variantes primária, secundária, discreta e destrutiva, com estado ocupado;
- `NField`: rótulo, ajuda e erro para campos;
- `NModal`: diálogo semântico com fechamento padronizado;
- `ProductState`: loading, vazio, erro, offline, sincronização e sucesso;
- `ToolLayout`: cabeçalho interno, ações, estado e rodapé de ferramentas.

Os componentes mantêm foco visível, área de toque mínima, rótulos acessíveis e feedback por `role=status` ou `role=alert`. Ferramentas usam as mesmas classes para toolbar, campos, abas, listas, vazio, progresso e feedback. Em telas estreitas, editores e formulários deixam de usar múltiplas colunas antes de causar rolagem horizontal.

Novos componentes devem começar pelos tokens e pelos componentes acima. Uma exceção deve representar uma necessidade do conteúdo, não uma nova linguagem visual.
