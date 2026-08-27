import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.info(`SarakuSetu Node backend listening on port ${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals) => {
  console.info(`${signal} received; shutting down`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
