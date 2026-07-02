# Publicação no GitHub Pages

O site pode ser publicado no GitHub Pages pela pasta `docs/`.

## Gerar a versão estática

```powershell
python scripts\build_evolucao_acoes.py
python scripts\build_funil_acoes.py
python scripts\build_painel_acoes_yield_cost.py
python scripts\build_proventos.py
python scripts\build_tabela_dados.py
python scripts\build_relatorio_yield_12m.py
python scripts\export_github_pages.py
```

A pasta `docs/` recebe:

- páginas HTML;
- imagens do relatório;
- `static/api/*.json`, exportado do SQLite;
- `static/api-client.js`, que simula os endpoints `/api/...` no GitHub Pages.

## Configuração no GitHub

1. Crie um repositório no GitHub.
2. Envie este projeto para o repositório.
3. Vá em `Settings > Pages`.
4. Em `Build and deployment`, escolha:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
5. Salve.

Depois de alguns minutos, o GitHub Pages publica o site.
