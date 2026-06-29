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
    refreshToken:    typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
    isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  },
  reducers: {
    setCredentials(state, { payload: { token, refreshToken, user } }) {
      state.token           = token;
      state.refreshToken    = refreshToken;
      state.user            = user;
      state.isAuthenticated = true;
      if (token)        localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user)         localStorage.setItem('user', JSON.stringify(user));
    },
    // Called by the Axios interceptor to silently update only the access token
    setAccessToken(state, { payload: token }) {
      state.token = token;
      if (token) localStorage.setItem('token', token);
    },
    // Called after a successful S3 upload + /confirm flow
    setProfilePicture(state, { payload: key }) {
      if (state.user) {
        state.user = { ...state.user, profilePictureKey: key };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    // Merges latest user profile updates
    updateUser(state, { payload: user }) {
      if (state.user) {
        state.user = { ...state.user, ...user };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    clearCredentials(state) {
      state.token           = null;
      state.refreshToken    = null;
      state.user            = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, setAccessToken, setProfilePicture, updateUser, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
