# Plano de Refatoração Premium - Caltec Insights

Refatoração completa do layout para um padrão corporativo executivo, implementando duas visões distintas: Home (Global) e Cliente (Filtrado), com design system Dark Premium.

## Design System (Dark Executive)
- **Cores:** Fundo `#090D16`, Cards `#111827`, Bordas semi-transparentes (glassmorphism), Primário `#0EA5E9`, Viagens `#10B981`.
- **Tipografia:** Números tabulares para alinhamento perfeito de métricas.

## 1. Tela Inicial (Sem Filtro)
- **Header Hero:** Título "Caltec Insights" com subtítulo e barra de pesquisa centralizada (Ctrl + K).
- **KPIs Globais:** 
  - Volume Total (Ano) + Indicador YoY.
  - Carregamentos Ativos Hoje.
  - SLA OTD Global.
  - Top Destino do Mês.
- **Acesso Rápido:** Grid de clientes recentes/principais para navegação rápida.

## 2. Visão do Cliente (Pós-Filtro)
- **Layout Above the Fold:** Otimização vertical rigorosa para evitar scroll.
- **Header Slim (80px):** Logo, nome, cidade/UF e ações (PDF/Exportar).
- **Métricas Chave:**
  - Volume Anual com Sparkline de tendência.
  - Viagens + Carga Média.
  - OTD com status visual (Semáforo).
  - Geolocalização.
- **Gráficos Executivos:** Grid de 2 colunas equilibradas (Volume Mensal vs. Caminhões/OTD).

## Detalhes Técnicos
- Implementação de `isClientSelected` para alternar visualizações.
- Refatoração dos componentes `KpiCard` e `ChartCard` para o novo design system.
- Otimização das queries de métricas para dados globais na Home.
- Adição de `CmdBar` ou similar para busca avançada.
