import { apiFetch } from "@/lib/api";
import type { ApprovalPayload, ApprovalResponse, DocumentAnalysis } from "@/types";

export async function uploadDocument(file: File): Promise<DocumentAnalysis> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<DocumentAnalysis>("/api/v1/documents/upload", {
    method: "POST",
    body: form,
  });
}

export async function processText(text: string): Promise<DocumentAnalysis> {
  return apiFetch<DocumentAnalysis>("/api/v1/documents/text", {
    method: "POST",
    body: { text },
  });
}

export async function approveDocument(
  requestId: string,
  payload: ApprovalPayload
): Promise<ApprovalResponse> {
  return apiFetch<ApprovalResponse>(
    `/api/v1/documents/${encodeURIComponent(requestId)}/approve`,
    { method: "POST", body: payload }
  );
}
