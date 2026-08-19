---
name: Executive Dashboard UI Refactor
description: Refactor the dashboard to a clean, professional, SaaS-like visual style with explicit data labels and improved KPI cards.
type: design
---

# Plan - Executive Dashboard UI Refactor

Refactor the "Relatório do Cliente — Caltec" dashboard to follow a modern, executive SaaS aesthetic (light theme by default, clean borders, professional charts).

## Proposed Changes

### 1. Global Styles & Theme (`src/styles.css`)
- Revert the default theme to a professional light theme (white backgrounds, soft gray borders).
- Update color tokens for the light theme:
  - Background: `#F8FAFC` (Slate 50)
  - Card: `#FFFFFF`
  - Border: `#E2E8F0`
  - Text: Slate 900 for headings, Slate 600 for body.
  - Accent: Royal Blue (as requested for charts) and Emerald (for status).
  - Primary (Caltec Amber): Preserve for branding (logo, accents).

### 2. Dashboard Layout & Components (`src/routes/index.tsx`, `src/components/report/*`)
- **KPI Cards**: Redesign `KpiCard` to be larger, with bold typography (e.g., `text-4xl` for values) and clear labels.
- **Chart Cards**: Update `ChartCard` with `#E2E8F0` borders and a soft `shadow-sm`.
- **Filters**: Clean up the filter bar to match the new executive look.

### 3. Charts (Recharts implementation in `src/routes/index.tsx`)
- **Data Labels**: Add `<LabelList />` or custom labels to Bar, Line, and Pie charts to show exact values.
- **Tooltips**: Customize `<Tooltip />` with better padding, rounded corners, and clear formatting.
- **Grids/Axes**: Soften or remove grid lines (`stroke="#F1F5F9"`).
- **Zero Values**: Filter or dim data points with 0 value.
- **Specific Labels**: 
  - Volume: show "X t" above bars.
  - Carrier ranking: show "Count (Percentage%)".

## Technical Details

- **Tailwind v4**: Using `@theme` in `src/styles.css` to update semantic variables.
- **Recharts**: 
  - Use `LabelList` with `position="top"` for Bar charts.
  - Custom `content` prop for `Tooltip` for executive styling.
  - Implement percentage calculations for labels where needed.

## Verification Plan

- **Visual Check**: Open the preview and verify the light theme transition.
- **Chart Labels**: Verify labels are visible and correctly formatted.
- **PDF Export**: Ensure the print style still looks like the official letterhead but aligns with the new layout logic.
