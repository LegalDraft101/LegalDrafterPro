/**
 * Single place for all API HTTP calls.
 * Uses credentials: 'include' for HttpOnly cookies. No PII/tokens in frontend.
 * VITE_API_URL: leave empty in dev (use Vite proxy); or set to API origin with no path (e.g. http://localhost:4000).
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) return p;
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${p}`;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  /** If true, 401 returns null instead of throwing (for /auth/me when not logged in). */
  allow401?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = 10000, allow401 = false, ...init } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    },
    signal: controller.signal,
  });
  clearTimeout(id);
  const data = (await res.json().catch(() => ({}))) as { error?: string; [k: string]: unknown };
  if (!res.ok) {
    if (allow401 && res.status === 401) return null as T;
    let errMsg = data.error ?? `Request failed: ${res.status}`;
    if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('invalid input')) {
      errMsg = 'Invalid email';
    }
    throw new Error(errMsg);
  }
  return data as T;
}
