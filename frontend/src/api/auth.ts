import { apiFetch, tokenStorage } from "@/lib/api";
import type { AuthResponse, LoginPayload, User } from "@/types";

export async function login(payload: LoginPayload): Promise<User> {
  const res = await apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });

  if (!res.access_token) throw { message: "No token returned." };
  tokenStorage.set(res.access_token);
  return await me();
}

export async function me(): Promise<User> {
  return apiFetch<User>("/api/v1/auth/me");
}

export function logout(): void {
  tokenStorage.clear();
}
