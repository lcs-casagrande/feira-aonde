# Cadastro de Feira de Rua

Web app em React para coletar cadastros de feiras de rua.

## Páginas

- Cadastro rápido: formulário mínimo para respostas rápidas.
- Complementar informações: formulário completo para dados detalhados.

## Publicação

O projeto é estático e pode ser publicado no GitHub Pages a partir da raiz do repositório.

## Dados

A base inicial de feiras fica em `data/feiras.csv` e `data/feiras.json`.

Para atualizar a base, rode:

```bash
python scripts/build_feiras_data.py
```
