const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const ACCESS_KEY = "vellora_access";
const REFRESH_KEY = "vellora_refresh";
const USER_KEY = "vellora_user";

export const tokenStore = {
  getAccess: () => sessionStorage.getItem(ACCESS_KEY),
  getRefresh: () => sessionStorage.getItem(REFRESH_KEY),
  getUser: () => {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  save({ access, refresh, user }) {
    sessionStorage.setItem(ACCESS_KEY, access);
    sessionStorage.setItem(REFRESH_KEY, refresh);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

async function request(path, { method = "GET", body, auth = false, retry = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && tokenStore.getAccess()) {
    headers.Authorization = `Bearer ${tokenStore.getAccess()}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && retry && tokenStore.getRefresh()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, { method, body, auth, retry: false });
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function requestOtp(phone_number) {
  return request("/auth/otp/request/", {
    method: "POST",
    body: { phone_number },
  });
}

export async function verifyOtp(phone_number, code) {
  const data = await request("/auth/otp/verify/", {
    method: "POST",
    body: { phone_number, code },
  });
  tokenStore.save(data);
  return data;
}

export async function refreshAccessToken() {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;
  try {
    const data = await request("/refresh/", {
      method: "POST",
      body: { refresh },
      retry: false,
    });
    if (data.access) sessionStorage.setItem(ACCESS_KEY, data.access);
    if (data.refresh) sessionStorage.setItem(REFRESH_KEY, data.refresh);
    return Boolean(data.access);
  } catch {
    tokenStore.clear();
    return false;
  }
}

// These routes are intentionally prepared, but must not be called until
// matching Django REST endpoints are implemented.
export const chatApi = {
  listConversations: () => request("/chat/conversations/", { auth: true }),
  getMessages: (conversationId, params = "") =>
    request(`/chat/conversations/${conversationId}/messages/${params}`, { auth: true }),
  createPrivateConversation: (userId) =>
    request("/chat/conversations/private/", { method: "POST", auth: true, body: { user_id: userId } }),
  createGroupConversation: (payload) =>
    request("/chat/conversations/groups/", { method: "POST", auth: true, body: payload }),
  sendMessage: (conversationId, content) =>
    request(`/chat/conversations/${conversationId}/messages/`, {
      method: "POST", auth: true, body: { content },
    }),
};

export function websocketUrl(conversationId) {
  const wsBase = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
  const token = tokenStore.getAccess();
  return `${wsBase}/ws/chat/${conversationId}/?token=${encodeURIComponent(token || "")}`;
}
