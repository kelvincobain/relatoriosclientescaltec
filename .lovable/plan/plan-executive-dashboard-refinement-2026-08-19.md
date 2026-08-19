# Plan - Executive Dashboard Refinement

Refine the dashboard to match the executive requirements: conversion of charts to cards for yearly views, dynamic coloring for OTD, fixing data visibility in rankings, and adjusting time series start dates.

## User Improvements
- **Volume & Trucks by Year**: Replace bar charts with KPI-style cards showing the specific value for the year (e.g., "Volume em 2026: 195t").
- **OTD Geral**: Implement conditional coloring for the donut chart (Green > 98%, Red <= 98%).
- **Carrier Ranking**: Add load counts next to the carrier names/bars to ensure all numbers are visible.
- **Average Discharge Time by Year**: Convert the yearly discharge chart into a simple KPI card.
- **Monthly Charts**: Ensure time series (Volume, Trucks, Discharge) start from May if data before that is missing or irrelevant.

## Technical Details
- **src/routes/index.tsx**:
    - Update the OTD `PieChart` to use conditional `fill` based on `otdYear.rate`.
    - Add `LabelList` with `dataKey="loads"` to the `carrierRanking` chart.
    - Replace `yearly` bar charts for Volume and Trucks with custom card layouts inside `ChartCard` or `KpiCard`.
    - Filter `monthly` and `dischargeByMonth` arrays to start from index 4 (May) if required, or ensure they respect the user's data range.
    - Update `KpiCard` component to support conditional text coloring if needed for OTD.
- **src/lib/report-metrics.ts**:
    - Ensure `yearlySeries` and `monthlySeries` provide clear access to specific year values for the card display.
