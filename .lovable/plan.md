# Plano de Alinhamento e Refinamento Premium - Dashboard Caltec

Este plano visa corrigir o alinhamento dos gráficos e cartões (Mes vs Ano) e ajustar o posicionamento dos componentes de OTD para um layout "Premium" e perfeitamente encaixado, conforme solicitado.

## Alterações Propostas

### 1. Alinhamento de Volume e Caminhões (Gráfico + Card)
- Agrupar o gráfico de "Volume por Mês" com o cartão de "Volume Anual" em uma linha coesa.
- Agrupar o gráfico de "Caminhões por Mês" com o cartão de "Caminhões Anual" de forma idêntica.
- Ajustar as alturas para que o cartão preencha o espaço vertical do gráfico, criando um bloco visual único.

### 2. Ajuste do Fluxo de OTD
- Mover o gráfico de "OTD do Período" (barras) para o grid principal.
- Posicionar o "OTD Geral" (pizza) ao lado do gráfico mensal em um layout de 2 colunas, eliminando o espaço vazio.

### 3. Refinamento de Descarga e Cancelamentos
- Alinhar o gráfico de "Tempo Médio de Descarga" com seu respectivo cartão anual.
- Organizar a "Distribuição" e os "Cancelamentos" para manter a simetria do dashboard.

### 4. Estética Premium e "Perfect Fit"
- Padronizar espaçamentos (`gap-4`) e arredondamentos de borda em todo o site.
- Garantir que todos os cartões de KPI tenham a mesma altura quando estiverem lado a lado com gráficos.

## Detalhes Técnicos

- **Tecnologia:** React + Tailwind CSS.
- **Componentes:** Utilização de `div` com `grid-cols-2` (desktop) e `flex-col` (mobile).
- **Layout:** Reorganização da ordem de renderização em `src/routes/index.tsx`.
