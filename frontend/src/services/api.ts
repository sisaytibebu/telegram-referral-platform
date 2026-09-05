/**
 * Axios API service.
 * All HTTP calls go through this instance.
 */
import axios from 'axios';

// In production (Netlify) VITE_API_URL = https://your-app.up.railway.app/api
// In development the Vite proxy handles /api → localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Request interceptor — attach JWT if present ───────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      // Redirect to login only if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ── Typed health-check helper ─────────────────────────────────────────────────
export interface HealthResponse {
  success: boolean;
  message: string;
  data?: {
    status: string;
    timestamp: string;
    environment: string;
    services: {
      database: string;
      api: string;
    };
    version: string;
    uptime: number;
  };
}

export const checkHealth = (): Promise<HealthResponse> =>
  api.get<HealthResponse>('/health').then((r) => r.data);

export default api;
