import axios from 'axios';
import { mockRequest } from './mockApi';

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 MOCK MODE — set to true to bypass the real backend and use fake data
//    Set to false when your backend is running and you want real API calls.
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_MODE = true;

const apiBaseUrl = 'https://clashcode.duckdns.org/';

// Main API instance — all app requests use this
const api = axios.create({ baseURL: apiBaseUrl });

// Separate instance used only for token refresh to avoid infinite loops
const refreshApi = axios.create({ baseURL: apiBaseUrl });

// ── Mock Interceptor ──────────────────────────────────────────────────────────
// When MOCK_MODE is enabled, short-circuit all requests before they hit the network
api.interceptors.request.use(async (config) => {
  if (!MOCK_MODE) {
    // Real mode: attach access token as usual
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  // Mock mode: intercept and resolve from mockApi
  const method = config.method?.toUpperCase() || 'GET';
  // Strip the base URL to get the path (e.g. "/auth/login")
  const rawUrl = config.url || '';
  const path = rawUrl.startsWith('http') ? new URL(rawUrl).pathname : rawUrl;

  try {
    const body = config.data
      ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data)
      : undefined;

    const mockResponse = await mockRequest(method, path, body);

    // Throw an axios-cancel to prevent the real request from firing,
    // then resolve via a resolved promise using the adapter pattern.
    config.adapter = () => Promise.resolve({
      data: mockResponse.data,
      status: mockResponse.status,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    });
  } catch (err) {
    console.error('[MOCK API] Error in mock handler:', err);
  }

  return config;
});

// ── Real Response Interceptor ─────────────────────────────────────────────────
// Only applies when MOCK_MODE = false (real backend)

const normalizeIds = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeIds);
  const copy = { ...obj };
  if (copy.id && !copy._id) copy._id = copy.id;
  if (copy._id && !copy.id) copy.id = copy._id;
  for (const key of Object.keys(copy)) {
    if (copy[key] && typeof copy[key] === 'object') {
      copy[key] = normalizeIds(copy[key]);
    }
  }
  return copy;
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (response.data) response.data = normalizeIds(response.data);
    return response;
  },
  async (error) => {
    // In mock mode, errors shouldn't normally happen — just reject
    if (MOCK_MODE) return Promise.reject(error);

    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (!storedRefreshToken) {
      isRefreshing = false;
      processQueue(error);
      forceLogout();
      return Promise.reject(error);
    }

    try {
      const res = await refreshApi.post('/auth/refresh', {
        refreshToken: storedRefreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = res.data.data;

      localStorage.setItem('token', accessToken);
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function forceLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

export default api;
