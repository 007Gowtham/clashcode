import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roomReducer from './slices/roomSlice';
import contestReducer from './slices/contestSlice';
import socketReducer from './slices/socketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    room: roomReducer,
    contest: contestReducer,
    socket: socketReducer,
  },
});
