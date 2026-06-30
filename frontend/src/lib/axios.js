import axios from 'axios';

<<<<<<< HEAD
<<<<<<< HEAD
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
=======
const apiBaseUrl =  'http://13.201.230.50:5000/';
>>>>>>> 7c3775e365c46862f352e28838721a26494e0bd7
=======
const apiBaseUrl =  'https://clashcode.duckdns.org/';
>>>>>>> 5dae437708ec66ebf35c6375cbfdf50a886c819c

// Main API instance — all app requests use this
const api = axios.create({ baseURL: apiBaseUrl });

// Separate instance used only for token refresh to avoid infinite loops
const refreshApi = axios.create({ baseURL: apiBaseUrl });

// ── Request Interceptor ────────────────────────────────────────────────────────
// Attach the current access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptor ───────────────────────────────────────────────────────
// Silently refresh the access token when a 401 is received
let isRefreshing = false;       // prevents parallel refresh storms
let failedQueue = [];           // queued requests waiting for the new token

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const normalizeIds = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(normalizeIds);
  }
  const copy = { ...obj };
  if (copy.id && !copy._id) {
    copy._id = copy.id;
  }
  if (copy._id && !copy.id) {
    copy.id = copy._id;
  }
  for (const key of Object.keys(copy)) {
    if (copy[key] && typeof copy[key] === 'object') {
      copy[key] = normalizeIds(copy[key]);
    }
  }
  return copy;
};

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = normalizeIds(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and only once per request (_retry flag)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip the refresh endpoint itself to avoid infinite loops
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('refreshToken')
      : null;

    if (!storedRefreshToken) {
      // No refresh token — must log in again
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

      // Persist the new tokens
      localStorage.setItem('token', accessToken);
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

      // Notify all queued requests of the new token
      processQueue(null, accessToken);

      // Retry the original request with the new access token
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

/**
 * Clears all stored tokens and redirects to the login page.
 * Isolated here so we don't need to import Redux store into this file.
 */
function forceLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

export default api;
