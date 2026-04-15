import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRouter from './routes/auth.js';
import donorRouter from './routes/donors.js';
import requestRouter from './routes/requests.js';
import interactionsRouter from './routes/interactions.js';
import db from './db.js';
import { PORT, getCorsOriginHandler, validateRuntimeConfig } from './config.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: getCorsOriginHandler(), methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/donors', donorRouter);
app.use('/api/requests', requestRouter);
app.use('/api/interactions', interactionsRouter);

async function startServer() {
  validateRuntimeConfig();
  await db.query('SELECT 1');

  const server = app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the previous backend process, then retry.`);
      process.exit(1);
    }

    console.error('Server error:', error.message);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API:', error.message);
  process.exit(1);
});
