import { createSlice } from '@reduxjs/toolkit';

const getLocal = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            getLocal('user'),
    token:           typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  },
  reducers: {
    setCredentials(state, { payload: { token, user } }) {
      state.token           = token;
      state.user            = user;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearCredentials(state) {
      state.token           = null;
      state.user            = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
