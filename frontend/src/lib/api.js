const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    credentials: 'include', // Include HttpOnly cookies (access_token)
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  // Parse response
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorCode = null;
    if (data && typeof data === 'object') {
      errorCode = data.code || null;
      if (Array.isArray(data.errors)) {
        errorMessage = data.errors.join(' | ');
      } else if (data.errors && typeof data.errors === 'object') {
        errorMessage = Object.values(data.errors).join(', ');
      } else {
        errorMessage = data.message || data.error || errorMessage;
      }
    } else if (typeof data === 'string' && data.length > 0) {
      errorMessage = data;
    }
    const err = new ApiError(response.status, errorMessage, data);
    err.code = errorCode;
    throw err;
  }

  return data;
}

// 1. Auth API
export const authApi = {
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body }),
  login: (body) => apiFetch('/api/auth/login', { method: 'POST', body }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/api/auth/me', { method: 'GET' }),
};

// 2. Problems API
export const problemsApi = {
  list: ({ difficulty, tag, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', difficulty);
    if (tag) params.append('tag', tag);
    params.append('page', page);
    params.append('size', size);
    return apiFetch(`/problems?${params.toString()}`, { method: 'GET' });
  },
  getBySlug: (slug) => apiFetch(`/problems/${slug}`, { method: 'GET' }),
};

// 3. Admin Problems API
export const adminProblemsApi = {
  list: ({ page = 0, size = 20 } = {}) =>
    apiFetch(`/admin/problems?page=${page}&size=${size}`, { method: 'GET' }),
  get: (id) => apiFetch(`/admin/problems/${id}`, { method: 'GET' }),
  create: (body) => apiFetch('/admin/problems', { method: 'POST', body }),
  update: (id, body) => apiFetch(`/admin/problems/${id}`, { method: 'PUT', body }),
  publish: (id) => apiFetch(`/admin/problems/${id}/publish`, { method: 'POST' }),
  delete: (id) => apiFetch(`/admin/problems/${id}`, { method: 'DELETE' }),

  // Test cases
  listTestCases: (id) => apiFetch(`/admin/problems/${id}/testcases`, { method: 'GET' }),
  addTestCase: (id, body) => apiFetch(`/admin/problems/${id}/testcases`, { method: 'POST', body }),
  updateTestCase: (id, testCaseId, body) =>
    apiFetch(`/admin/problems/${id}/testcases/${testCaseId}`, { method: 'PUT', body }),
  deleteTestCase: (id, testCaseId) =>
    apiFetch(`/admin/problems/${id}/testcases/${testCaseId}`, { method: 'DELETE' }),

  // Starter codes
  upsertStarterCode: (id, body) =>
    apiFetch(`/admin/problems/${id}/starter-codes`, { method: 'POST', body }),
};

// 4. Rooms & Teams API
export const roomsApi = {
  listAvailable: ({ page = 0, size = 10 } = {}) =>
    apiFetch(`/rooms?page=${page}&size=${size}`, { method: 'GET' }),
  create: (body) => apiFetch('/rooms', { method: 'POST', body }),
  join: (body) => apiFetch('/rooms/join', { method: 'POST', body }),
  getActive: () => apiFetch('/rooms/active', { method: 'GET' }),
  get: (id) => apiFetch(`/rooms/${id}`, { method: 'GET' }),
  leave: (id) => apiFetch(`/rooms/${id}/leave`, { method: 'POST' }),
  start: (id) => apiFetch(`/rooms/${id}/start`, { method: 'POST' }),
  close: (id) => apiFetch(`/rooms/${id}/close`, { method: 'POST' }),
  kick: (id, userId, reason) =>
    apiFetch(`/rooms/${id}/kick/${userId}`, { method: 'POST', body: { reason } }),

  // Teams
  createTeam: (roomId, body) => apiFetch(`/rooms/${roomId}/teams`, { method: 'POST', body }),
  joinTeam: (roomId, body) => apiFetch(`/rooms/${roomId}/teams/join`, { method: 'POST', body }),
  leaveTeam: (roomId, teamId) =>
    apiFetch(`/rooms/${roomId}/teams/${teamId}/leave`, { method: 'POST' }),
  deleteTeam: (roomId, teamId) =>
    apiFetch(`/rooms/${roomId}/teams/${teamId}`, { method: 'DELETE' }),
  kickTeamMember: (roomId, teamId, userId) =>
    apiFetch(`/rooms/${roomId}/teams/${teamId}/kick/${userId}`, { method: 'POST' }),

  // Room Problems
  selectProblems: (roomId, body) =>
    apiFetch(`/rooms/${roomId}/problems`, { method: 'POST', body }),
  getContestProblems: (roomId) =>
    apiFetch(`/rooms/${roomId}/problems`, { method: 'GET' }),
};

// 5. Code Execution / Submissions API
export const submissionsApi = {
  submit: (body) => apiFetch('/submissions', { method: 'POST', body }),
  get: (id) => apiFetch(`/submissions/${id}`, { method: 'GET' }),
  getMySubmissions: ({ page = 0, size = 20 } = {}) =>
    apiFetch(`/submissions/user/me?page=${page}&size=${size}`, { method: 'GET' }),
  getRoomSubmissions: (roomId, { page = 0, size = 20 } = {}) =>
    apiFetch(`/submissions/room/${roomId}?page=${page}&size=${size}`, { method: 'GET' }),
  getRoomLeaderboard: (roomId) =>
    apiFetch(`/submissions/room/${roomId}/leaderboard`, { method: 'GET' }),
};

