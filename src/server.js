import http from 'http';
import app from './app.js';
import { PORT, NODE_ENV } from './config/env.js';
import { connectToDB, disConnectFromDB } from './databases/index.js';

const server = http.createServer(app);

server.listen(PORT, async () => {
  await connectToDB();

  console.log(`Server running on port ${PORT} | Env: ${NODE_ENV}`);
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

/*
   Process Event Listeners
*/

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
