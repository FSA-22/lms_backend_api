import os from 'os';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CLIENT_URL, NODE_ENV, PORT } from './config/env.js';
import AppError from './utils/appError.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

const app = express();

/*
   Core Middlewares
*/

// Security headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: CLIENT_URL || '*',
    credentials: true
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger (dev only)
if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/*
   Health Check
*/

app.get('/health', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  console.log(networkInterfaces, 'ips');

  const ips = Object.values(networkInterfaces)
    .flat()
    .filter((details) => details.family === 'IPv4' && !details.internal)
    .map((details) => details.address);

  res.status(200).json({
    success: true,
    message: `API is running on port ${5000}`,
    uptime: process.uptime(),
    timestamp: new Date(),
    serverIPs: ips
  });
});

//*404 Handler
//app.use((req, res) => {
  //res.status(404).json({
    //success: false,
    //message: 'Route not found'
  //});
//});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
//app.use((err, req, res, next) => {
  //console.error(err);

  //res.status(err.status || 500).json({
    //success: false,
    //message: err.message || 'Internal Server Error'
  //});
//});

app.use(errorMiddleware);
export default app;
