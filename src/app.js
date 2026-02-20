import os from 'os';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CLIENT_URL, NODE_ENV, PORT } from './config/env.js';

// Import ONLY your route for now (to isolate)
import coursesRoutes from './routes/courses.routes.js';

const app = express();

// Core Middlewares
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ────────────────────────────────────────────────
// YOUR ROUTE - Mounted by Ugoo (only this one for testing)
app.use('/api/courses', coursesRoutes);

// Health Check
app.get('/health', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  console.log(networkInterfaces, 'ips');

  const ips = Object.values(networkInterfaces)
    .flat()
    .filter((details) => details.family === 'IPv4' && !details.internal)
    .map((details) => details.address);

  res.status(200).json({
    success: true,
    message: `API is running on port ${PORT}`,
    uptime: process.uptime(),
    timestamp: new Date(),
    serverIPs: ips
  });
});

// 404 Handler (must be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;