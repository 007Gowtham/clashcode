import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('room:join', ({ roomId }) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('user:join', ({ userId }) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export const getIo = () => io;
