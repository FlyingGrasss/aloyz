import { sessionStorage } from "@/storage/sessionStorage";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "https://www.aloyz.co"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type JsonRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

async function request<T>(path: string, options: JsonRequestOptions = {}): Promise<T> {
  const { body, authenticated = true, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (authenticated) {
    const token = await sessionStorage.getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...requestOptions,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
  const response = await fetch(`${API_BASE_URL}${path}`, requestInit);

  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  } & T;

  if (!response.ok) {
    throw new ApiError(payload.error || "İstek tamamlanamadı.", response.status, payload.code);
  }
  return payload;
}

export const apiClient = {
  get<T>(path: string, authenticated = true) {
    return request<T>(path, { method: "GET", authenticated });
  },
  post<T>(path: string, body?: unknown, authenticated = true) {
    return request<T>(path, { method: "POST", body, authenticated });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "PATCH", body });
  },
  delete<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "DELETE", body });
  },
};
