# Plano de Ação: Integração IBGE e Filtro de Estado (UF)

O objetivo é aprimorar a precisão geográfica do dashboard utilizando a base oficial do IBGE e melhorar a navegação através de um novo filtro de Estado (UF) que cascateia para o filtro de Cidades.

## Alterações Técnicas

### 1. Processamento de Dados (`src/lib/report-data.ts`)
- Garantir que a coluna `Destino UF` (já mapeada em `COL.state`) seja extraída corretamente.

### 2. Métricas e Filtros (`src/lib/report-metrics.ts`)
- Adicionar `getStates` para listar UFs únicas na base.
- Modificar `getCities` para aceitar um filtro opcional de `state`.
- Atualizar o tipo `Selection` para incluir `state`.

### 3. Geocodificação IBGE (`src/lib/report-map.ts`)
- Criar um serviço de busca na API do IBGE (`https://servicodados.ibge.gov.br/api/v1/localidades/municipios`).
- Mapear o dataset cruzando `Nome da Cidade + UF` com o retorno do IBGE.
- Eliminar o fallback de coordenadas aleatórias e o dicionário estático limitado.

### 4. Interface do Dashboard (`src/routes/index.tsx`)
- Adicionar o `Select` de "ESTADO (UF)" antes do de "CIDADE".
- Implementar a lógica de cascateamento: selecionar UF limpa Cidade.
- Adicionar um resumo de "Estados Atendidos" no cabeçalho geográfico.

### 5. Componente de Mapa (`src/components/report/InteractiveMap.tsx`)
- Adicionar `selectedState` às props.
- No `MapController`, implementar o enquadramento dinâmico:
    - Se UF selecionada: `flyTo` ou `fitBounds` para os marcadores daquele estado.
    - Se nenhuma UF: `fitBounds` para todos os marcadores ativos no Brasil.
- Garantir que o zoom inicial não fique travado em Catanduva/SP.

## Considerações de UX
- O mapa deve responder instantaneamente à mudança de UF.
- Tooltips dos marcadores devem ser claros e informativos.
- A sincronização entre filtros e mapa deve ser bidirecional (clicar no mapa altera o filtro).
