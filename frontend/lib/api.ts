const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle token refresh logic here if needed
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || "API request failed");
  }

  return response.json();
}

export const authApi = {
  login: (credentials: any) => apiFetch("/auth/access", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  signup: (credentials: any) => apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  refresh: () => apiFetch("/auth/refresh", { method: "POST" }),
};

export const calculatorApi = {
  calculate: (expression: string, sessionId: string | number) => apiFetch("/calculate", {
    method: "POST",
    body: JSON.stringify({ expression, session_id: Number(sessionId) }),
  }),
  getHistory: (sessionId: string | number) => apiFetch(`/history/${Number(sessionId)}`),
  getSessions: () => apiFetch("/sessions"),
  createSession: (name: string) => apiFetch("/sessions", {
    method: "POST",
    body: JSON.stringify({ name }),
  }),
  deleteSession: (id: string | number) => apiFetch(`/sessions/${Number(id)}`, { method: "DELETE" }),
  renameSession: (id: string | number, name: string) => apiFetch(`/sessions/${Number(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  }),
  deleteHistoryItem: (id: string | number) => apiFetch(`/history/${Number(id)}`, { method: "DELETE" }),
};

export const userApi = {
  getMe: () => apiFetch("/user/me"),
  getProfile: (id: string) => apiFetch(`/user/${id}`),
  updateProfile: (id: string, data: any) => apiFetch(`/user/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
};
