
import { API_BASE_URL, API_KEY } from "./apiConfiguracion";

export interface ApiOptions extends Omit<RequestInit, "headers"> {
  auth?: boolean; 
  headers?: Record<string, string>;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...(headers || {}),
  };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: finalHeaders, 
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (body as any).mensaje || (body as any).error || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json();
}
