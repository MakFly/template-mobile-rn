import { createApp } from './app';

const port = Number(process.env.PORT || 3333);
const hostname = process.env.HOST || '127.0.0.1';
const { app } = createApp({
  databasePath: process.env.DATABASE_PATH || './data/template-mobile.sqlite',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL,
  openaiTitleModel: process.env.OPENAI_TITLE_MODEL,
});

console.info(`[api] listening on http://${hostname}:${port}`);

export default { port, hostname, fetch: app.fetch };
