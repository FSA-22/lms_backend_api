import { PORT, NODE_ENV } from './config/env.js';
import app from './app.js';
import { connectToDB, disConnectFromDB } from './databases/index.js';

// 1. CATCH BUGS IN CODE (Synchronous)
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// 2. START THE SERVER
const server = app.listen(PORT, async () => {
  await connectToDB();

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

/*
   Graceful Shutdown
*/

const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed.');
    await disConnectFromDB();

    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forcefully shutting down...');
    process.exit(1);
  }, 10000);
};
