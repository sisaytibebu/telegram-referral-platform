/**
 * Axios API service.
 * All HTTP calls go through this instance.
 */
import axios from 'axios';

// In production (Vercel) VITE_API_URL is set as env var in Vercel dashboard.
// Fallback to hardcoded Railway URL if env var is missing at build time.
// In development the Vite proxy handles /api → localhost:5000
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://telegram-referral-platform-production.up.railway.app/api'
    : '/api');

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
