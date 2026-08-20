import { useEffect, useState } from "react";
import { loadDataset, type Row } from "./report-data";
import { useQuery } from "@tanstack/react-query";

export function useReportData() {
  return useQuery({
    queryKey: ["report-data"],
    queryFn: async () => {
      const data = loadDataset();
      return data?.rows ?? [];
    },
    staleTime: 5000,
  });
}
