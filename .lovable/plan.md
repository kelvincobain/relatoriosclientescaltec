# Premium Dashboard Redesign Plan

I will refine the dashboard's aesthetic to a premium "Dark Executive" style while maintaining the current layout, data sources, and functionality.

## Proposed Changes

### 1. Global Design System & Typography
- **Palette**: Update `src/styles.css` with the specific hex codes requested:
  - Background: `#0B0F19`
  - Cards: `#131C2E`
  - Borders: `1px solid #1E293B`
- **Section Headers**: Add a specific style for headers (uppercase, letter-spacing) with a vertical amber highlight line (`#F59E0B`).

### 2. Chart Refinements (Recharts)
- **Average Discharge Time**:
  - Convert the monthly bar/block chart to an `AreaChart` with a smooth `monotone` curve.
  - Add a vertical gradient (Amber `#F59E0B` to transparent).
  - Add a dashed horizontal `ReferenceLine` for the yearly average (27.6h).
- **Volume & Truck Charts**:
  - **Volume**: Apply a vertical gradient from Sky Blue (`#38BDF8`) to Indigo (`#6366F1`).
  - **Trucks**: Apply a vertical gradient from Purple (`#8B5CF6`) to Dark Blue (`#3B82F6`).
  - **Styling**: Add `radius={[4, 4, 0, 0]}` to bars and clean up data labels (font size/color `#94A3B8`).

### 3. Component Updates
- **KpiCard**:
  - Add support for a "progress bar" sub-indicator for the "On Time" and "Urgent" cards.
  - Add a badge system for discrete status indicators in the corner.
  - Ensure background/border matching the new executive palette.
- **Header Line**: Update the dashboard structure to include the amber accent line on section titles.

### 4. Visibility & Data
- Update the `sr-only` prompt text as requested.
- Ensure all data labels are visible and not clipped.

## Technical Details
- Using `defs` in Recharts for SVG gradients.
- Tailwind utility classes for the new color palette.
- React components for the new progress indicators within cards.
