import { createSlice } from '@reduxjs/toolkit';

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    connected: false,
  },
  reducers: {
    setSocketConnected(state, { payload }) {
      state.connected = Boolean(payload);
    },
  },
});

export const { setSocketConnected } = socketSlice.actions;
export default socketSlice.reducer;
