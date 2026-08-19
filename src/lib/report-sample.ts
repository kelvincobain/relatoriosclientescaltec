import { Row } from "@/lib/report-data";

/**
 * Sample data generator for Caltec report.
 * Provides a rich set of data for initial visualization.
 */
export function buildSampleRows(): Row[] {
  // We'll keep this empty for now so the user can upload their official base
  // as the "default official base" as requested.
  // The app will detect empty localStorage and show "Upload base" or we can
  // provide a very small set to avoid a completely blank screen if preferred.
  return [];
}
