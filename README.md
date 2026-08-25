# Caltec Insights

Prompt para o Lovable — Dashboard "One Page Report" Caltec (Cal Industrial)

Cole o texto abaixo diretamente no chat do Lovable para iniciar o projeto.

PROMPT

Crie uma aplicação web em React (Vite + TailwindCSS) chamada "Relatório do Cliente — Caltec", no estilo one page report / dashboard, tema escuro e profissional, inspirada visualmente no site institucional https://caltec.com.br (indústria de mineração/química — paleta escura, tons de grafite/preto, um único tom de destaque em âmbar/laranja queimado para contraste, tipografia limpa sem serifa, muito espaço em branco, sem gradientes ou efeitos decorativos).

1. Upload e persistência da base de dados

Tela inicial (ou botão fixo no topo, visível só em modo admin) com um botão "Atualizar base de dados" que permite subir um arquivo Excel/CSV.

Ao subir, o sistema deve parsear e substituir a base atual, salvando em armazenamento local da aplicação (a base é estática — atualizada manualmente sob demanda, não em tempo real).

Importante: a primeira base que vou subir é provisória (uma amostra menor, só para você construir e validar a estrutura, os filtros e os gráficos). Depois vou subir a base real definitiva, bem maior, usando o mesmo botão de atualização — os nomes das colunas são exatamente os mesmos entre as duas, então nenhuma lógica muda, só o volume de linhas. Construa o parser e os filtros de forma genérica (sem hardcode de cidades, clientes, datas ou quantidades específicas da base provisória), para que a troca pela base real funcione sem qualquer ajuste manual no código.

Colunas reais da planilha enviada (aba "Operacoes", 674 linhas, 41 colunas) — usar exatamente estes nomes:

Destino Município → é a coluna de "Cidade" (não existe coluna chamada Cidade; usar esta para o filtro de cidade)

Nome Entrega (cliente)

Produto (filtrar só Cal industrial — confirmado: 467 das 674 linhas)

Peso (kg) (numérico, já em kg)

Placa

Transportadora

OTD — valores reais: Aderente / Não Aderente (com N maiúsculo)

Quando chegou no cliente (texto no formato DD/MM/AAAA HH:MM, ex: 03/08/2026 21:19)

Quando finalizou (mesmo formato)

Data de coleta → usar como data de referência do carregamento para agrupar por mês/ano (mesmo formato DD/MM/AAAA HH:MM)

Status → usada só para o indicador de cancelamentos (seção 5.7). Valor de cancelamento: Frete cancelado (aplicar trim, vem com espaço extra na frente na base).

Data prevista entrega → usada para identificar se um cancelamento foi refeito (ver regra de deduplicação na seção 5.7).

Atenção: as colunas Quando chegou no cliente e Quando finalizou têm bastante linha vazia (na base de teste, só ~287 de 467 linhas de Cal industrial têm as duas datas preenchidas). O cálculo de tempo de descarga e as faixas (5h/12h/24h) devem ignorar silenciosamente as linhas sem as duas datas preenchidas, sem contar como zero e sem quebrar o gráfico.

Confirmado o problema de clientes homônimos: nomes como RAIZEN ENERGIA S.A. aparecem em 11 cidades diferentes, COCAL COMERCIO INDUSTRIA CANAA ACUCAR E ALCOOL LTDA em 2 cidades, etc. — por isso o filtro de cliente tem que ficar condicionado à cidade escolhida antes, exatamente como pedido.

2. Filtro de produto (fixo, não visível ao cliente)

A aplicação deve considerar apenas as linhas onde Produto = "Cal industrial". Todo o restante da base é ignorado nos cálculos e nos filtros.

3. Filtros em cascata (visíveis ao cliente)

Filtro 1: Cidade (dropdown).

Filtro 2: Cliente (coluna Nome Entrega (cliente)), popula somente depois que a cidade é escolhida, e mostra apenas os clientes que existem naquela cidade — isso evita confundir clientes homônimos de cidades diferentes.

Nenhum gráfico ou número é exibido antes de cidade + cliente estarem selecionados.

Adicionar um seletor de ano (e opcionalmente mês) para os gráficos que fazem sentido por mês, com um "Ano completo" como visão padrão.

4. Botão "Exportar PDF"

Botão fixo no topo (ou rodapé) "Gerar PDF" que exporta a visualização atual (com o cliente e cidade selecionados) para PDF, mantendo o layout do dashboard, pronto para envio ao cliente.

O PDF deve usar como cabeçalho o papel timbrado da Caltec (arquivo de imagem será fornecido — usar como header/logo fixo no topo do PDF e da própria página).

5. Indicadores e gráficos (todos filtrados por Cidade + Cliente + Produto = "Cal industrial")

5.1 Volume (toneladas)

Fonte: soma de Peso (kg) convertido para toneladas (kg / 1000).

Gráfico de barras por mês (ano selecionado).

Gráfico de barras (ou linha) por ano (comparativo entre anos disponíveis).

5.2 Quantidade de caminhões

Fonte: contagem de Placa (contar entregas/registros; se quiser único por placa, contar placas distintas — deixar como opção configurável, mas o padrão é contagem de carregamentos).

Gráfico de barras por mês e por ano.

5.3 Transportadoras

Fonte: contagem de carregamentos agrupados por Transportadora.

Gráfico de barras horizontal, ranking anual (não por mês) — quantidade de carregamentos por transportadora no ano selecionado.

5.4 OTD (On Time Delivery)

Fonte: coluna OTD, valores "Aderente" x "Não aderente".

Gráfico de pizza (donut) por mês selecionado.

Gráfico de pizza (donut) consolidado do ano.

Mostrar percentual de aderência com destaque (número grande) ao lado do gráfico.

5.5 Tempo médio de descarga

Cálculo: diferença entre Quando finalizou e Quando chegou no cliente (ambas no formato DD/MM/AAAA HH:MM), resultado em horas (decimal). Descartar a linha do cálculo se qualquer uma das duas datas estiver vazia.

Aplicar somente a partir de maio do ano selecionado (ignorar meses anteriores a maio no cálculo e nos gráficos, mesmo que o ano tenha dados anteriores).

Gráfico de barras/linha com a média de horas por mês (maio em diante).

Gráfico com a média anual (comparando anos, considerando sempre só maio em diante).

5.6 Distribuição de tempo de descarga por faixa

A partir do mesmo cálculo de horas de descarga (maio em diante), classificar cada carregamento em faixas:

Até 5h

Acima de 5h até 12h

Acima de 12h até 24h

Acima de 24h

Gráfico de barras (ou pizza) mostrando a quantidade de carregamentos em cada faixa, com seletor de mês/ano.

5.7 Cancelamentos reais

Fonte: coluna Status, valor Frete cancelado (aplicar trim() no valor antes de comparar — na base vem com espaço extra na frente).

Regra de deduplicação obrigatória: um embarque com Status = Frete cancelado só conta como cancelamento real se, dentro do mesmo Nome Entrega (cliente) + Destino Município, não existir outro embarque (qualquer status) com a mesma Data prevista entrega. Se existir outro registro com a mesma combinação cliente + cidade + data prevista de entrega, entende-se que o carregamento foi refeito, e o cancelamento não deve ser contado como perda real — some 1 apenas ao indicador de "reagendamentos", não ao de "cancelamentos".

Passo a passo para implementar:

Filtrar todos os registros do cliente + cidade selecionados (antes do filtro de produto, já que o cancelamento pode ter ocorrido em qualquer produto do mesmo pedido — mas manter o card de cancelamento específico à seleção de Cal industrial, igual aos demais indicadores).

Agrupar por Data prevista entrega dentro desse cliente + cidade.

Para cada grupo com mais de um registro E que contenha pelo menos um Frete cancelado: se houver também algum registro com status diferente de cancelado na mesma data, tratar o cancelado como "refeito" (não conta).

Se o grupo só tiver o registro cancelado (sem duplicata na mesma data), contar como cancelamento real.

Exibir dois números lado a lado no card de KPI: Cancelamentos reais (contagem final após a dedução) e Refeitos (quantos cancelados foram identificados como redo, para transparência).

Gráfico de barras por mês e por ano com a quantidade de cancelamentos reais (já deduplicados).

6. Layout geral

Cabeçalho fixo com logo/papel timbrado da Caltec, nome do cliente e cidade selecionados em destaque.

Filtros (Cidade → Cliente → Ano) em uma barra logo abaixo do cabeçalho.

Cards de KPI no topo (volume total do ano, nº de caminhões, % OTD, tempo médio de descarga, cancelamentos reais) antes dos gráficos detalhados.

Gráficos organizados em grid de 2 colunas em telas largas, empilhados em mobile.

Sem menu de navegação lateral — é literalmente um "one page report", rolagem vertical única.

Tema escuro por padrão (grafite/preto de fundo, texto claro, um único tom de destaque âmbar/laranja para barras e realces), tipografia sem serifa, cantos levemente arredondados, sem sombras pesadas nem gradientes — visual industrial e sóbrio.

7. Dados de exemplo

Enquanto a base real não é carregada, popular a interface com dados fictícios de exemplo (2-3 cidades, 2-3 clientes, 12 meses, 2 anos) só para validar os componentes e gráficos.

Papel timbrado (já conferido)

O PDF enviado (Papel_timbrado_Caltec_80_Anos.pdf) é um timbrado claro: fundo quase branco, formas hexagonais finas em azul/verde-água no topo, logo Caltec "80 anos" no canto superior direito, e marca d'água grande "80" em degradê azul/verde no rodapé, com caltec.com.br e endereço centralizados no pé da página. Instrução para o Lovable:

Usar este PDF como referência de cabeçalho/rodapé do PDF exportado (o dashboard em si continua em tema escuro; só o PDF gerado para o cliente reproduz esse papel timbrado claro, já que é o documento oficial de envio).

Extrair o logo "CALTEC 80 anos" e usar também como marca no cabeçalho da página web (em versão que funcione sobre fundo escuro).

Planilha (já conferida)

A base Fretes_painel_do_contratante__39_.xlsx (aba "Operacoes") já está com os nomes de coluna corrigidos na seção 1 acima — os ajustes principais foram: usar Destino Município no lugar de Cidade, os valores exatos do OTD (Aderente / Não Aderente), o formato de data DD/MM/AAAA HH:MM, e o tratamento de linhas sem Quando chegou no cliente/Quando finalizou preenchidos. O prompt já está pronto para colar no Lovable — pode subir a planilha real lá como primeira carga de dados.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://relatoriosclientescaltec.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fc9cba5d-03bc-4ebf-9b3c-54600fc967d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
