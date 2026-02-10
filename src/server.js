import { PORT, NODE_ENV } from './config/env.js';
import app from './app.js';

// 1. CATCH BUGS IN CODE (Synchronous)
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// 2. START THE SERVER
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} | Env: ${NODE_ENV}`);
});

// 3. CATCH BROKEN CONNECTIONS (Asynchronous)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});