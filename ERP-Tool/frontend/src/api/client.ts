import axios from 'axios';
import { useERPStore } from '../store/useERPStore';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request: attach token ──
apiClient.interceptors.request.use((config) => {
  const token = useERPStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: transparent refresh + queue ──
let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

apiClient.interceptors.response.use(null, async (error) => {
  const original = error.config;
  if (error.response?.status !== 401 || original._retry) throw error;

  if (refreshing) {
    return new Promise((resolve, reject) => {
      queue.push({ resolve, reject });
    }).then((token) => {
      original.headers.Authorization = `Bearer ${token}`;
      return apiClient(original);
    });
  }

  original._retry = true;
  refreshing = true;
  const refreshToken = localStorage.getItem('erp_refresh_token');

  if (!refreshToken) {
    useERPStore.getState().logout();
    throw error;
  }

  try {
    const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refreshToken });
    const newToken = data.access_token ?? data.accessToken;
    useERPStore.getState().setToken(newToken);
    queue.forEach((p) => p.resolve(newToken));
    queue = [];
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  } catch (err) {
    queue.forEach((p) => p.reject(err));
    queue = [];
    useERPStore.getState().logout();
    throw err;
  } finally {
    refreshing = false;
  }
});
