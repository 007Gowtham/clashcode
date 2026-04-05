import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initSocket } from './socket.js';

// Route Imports
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import teamRoutes from './routes/teams.js';
import questionRoutes from './routes/questions.js';
import submitRoutes from './routes/submit.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Protocol.'))
  .catch(err => {
    console.error('CRITICAL: Database connection failed. Aborting deployment.');
    process.exit(1);
  });

// API Routes - Using the real production logic
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/teams', teamRoutes);
app.use('/questions', questionRoutes);
app.use('/', submitRoutes); // Mounts /submit, /run, /test directly

// Global Health Check
app.get('/', (req, res) => {
  res.json({ status: 'operational', protocol: 'ClashCode-X', cluster: 'Sector-01' });
});

// Port Execution
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Command Center established on Port: ${PORT}`);
  console.log(`Tactical Interface synchronized at: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

export default app;