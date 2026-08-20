# Premium Redesign and A4 Landscape Optimization

This plan restructures the dashboard for a premium executive look optimized for A4 landscape export, ensuring all content is visible on a single screen without scrolling.

## User Review Required

> [!IMPORTANT]
> The dashboard will be locked to a fixed height (100vh) to fit A4 proportions. This means charts and cards will be smaller vertically to ensure everything fits on one page.

## Proposed Changes

### Visual & Layout (Executive Dark)
- Set background to `#0b0f19` (Deep Dark Navy).
- Update cards with `#131c2e` background, subtle `#1e293b` borders, and `8px` radius.
- Standardize section titles in Golden/Amber (`#f59e0b`) uppercase with slate gray subtexts.

### A4 Landscape Optimization
- Restructure the main container to `100vh` (no scroll).
- Implement specific CSS print rules for A4 landscape (8mm margins, forced background colors).

### Component Refactoring
- **SLA Chips**: Replace large service time cards with a compact horizontal bar containing 4 KPI chips (On-time, Urgent, Avg Discharge, Cancellations).
- **Lower Grid**: Place "Avg Discharge" and "Monthly Cancellations" charts side-by-side in a 2-column layout.
- **Chart Height**: Reduce internal chart heights by ~40% to save vertical space.

### Data & Content
- Maintain all existing calculations and data persistence.
- Update the hidden prompt text as requested by the user.

## Technical Details

- **Tailwind Classes**: Use `h-screen overflow-hidden` for the main wrapper.
- **Print CSS**: 
  ```css
  @page { size: A4 landscape; margin: 8mm; }
  @media print {
    body { background-color: #0b0f19 !important; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  ```
- **Responsive Layout**: Adjust the dashboard grid to ensure 100vh compatibility across common screen sizes.
