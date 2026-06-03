# Base de feiras

Arquivos consumíveis pelo site:

- `feiras.csv`: planilha principal em formato CSV.
- `feiras.json`: a mesma base em JSON, pronta para `fetch("./data/feiras.json")`.

## Campos

- `id`: identificador estável do registro.
- `municipio`: cidade da feira.
- `uf`: estado.
- `nome_feira`: nome conhecido ou nome gerado a partir de bairro/endereço.
- `categoria`: tradicional, noturna, orgânica ou feira livre tradicional.
- `dia_semana`: dia em que a feira acontece.
- `horario_inicio`: horário inicial quando conhecido.
- `horario_fim`: horário final quando conhecido.
- `endereco`: rua, avenida ou local principal.
- `numero`: número do endereço quando conhecido.
- `bairro`: bairro informado pela fonte.
- `referencia`: ponto de referência quando disponível.
- `subprefeitura`: subprefeitura, quando disponível.
- `quantidade_feirantes`: quantidade informada pela fonte quando disponível.
- `codigo_oficial`: código oficial quando disponível.
- `fonte_nome`: nome da fonte.
- `fonte_url`: URL da fonte.
- `status_validacao`: `fonte_internet`, `contribuicao_site` ou `confirmado`.
- `confirmado_desenvolvedor`: `sim` ou `nao`.
- `observacoes`: observações sobre origem e validação.

## Semáforo

- Amarelo: informação veio de fonte da internet ou contribuição do site e ainda aguarda confirmação.
- Verde: informação confirmada pelo desenvolvedor.

Não use avaliações, distâncias, produtos ou horários que não estejam na fonte. Quando o campo não existir na fonte, manter `-` ou `a confirmar`.

## Fontes

São Paulo usa a planilha oficial da Prefeitura de São Paulo/SESANA, marcada inicialmente como fonte da internet até confirmação do desenvolvedor.

Guarulhos usa uma lista pública local como base inicial e deve ser validada por usuários, feirantes, Prefeitura de Guarulhos ou pelo desenvolvedor.
