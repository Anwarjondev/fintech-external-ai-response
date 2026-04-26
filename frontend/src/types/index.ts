// Auth
export type UserRole = "admin" | "user" | "government" | string;
export type Organization = "bank" | "government" | string;

export type LoginPayload = {
  phone: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

export type User = {
  id?: string | number;
  phone: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  role?: UserRole;
  organization?: Organization;
  [key: string]: unknown;
};

// Documents
export type DocumentAnalysis = {
  request_id: string;
  source_filename?: string | null;
  topic: string;
  risk_level: string;
  deadline_days?: number | null;
  decision?: string | null;
  legal_reference?: string | null;
  reason?: string | null;
  response_text: string;
  retrieved_data?: Record<string, unknown> | null;
};

export type ApprovalPayload = {
  format: "pdf" | string;
  topic: string;
  response_text: string;
  retrieved_data: Record<string, unknown>;
  is_approved: boolean;
};

export type ApprovalResponse = {
  request_id?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
};

// History
export type HistoryFile = {
  request_id: string;
  source_filename?: string;
  topic: string;
  risk_level?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type HistoryResponse = {
  organization?: string;
  file_count?: number;
  files?: HistoryFile[];
  [key: string]: unknown;
};

// Errors
export type ApiError = {
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
};
