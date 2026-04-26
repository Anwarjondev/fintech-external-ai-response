import { apiFetch } from "@/lib/api";
import type { HistoryResponse } from "@/types";

export async function getHistory(): Promise<HistoryResponse> {
  return apiFetch<HistoryResponse>("/api/v1/statistics/history");
}
