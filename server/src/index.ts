import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { initWebSocket } from './services/websocket.js';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS — locked to known frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing with size limits
app.use(express.json({ limit: '2mb' }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// HTTP + WebSocket server
const server = createServer(app);
initWebSocket(server);

async function ensurePatientSixDigitIds() {
  try {
    const patients = await prisma.patient.findMany({ where: { sixDigitId: null } });
    if (patients.length > 0) {
      console.log(`🔑 Assigning 6-digit IDs to ${patients.length} patients lacking them...`);
      for (const p of patients) {
        let uniqueId = '';
        let isUnique = false;
        while (!isUnique) {
          uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
          const existing = await prisma.patient.findUnique({ where: { sixDigitId: uniqueId } });
          if (!existing) isUnique = true;
        }
        await prisma.patient.update({ where: { id: p.id }, data: { sixDigitId: uniqueId } });
      }
      console.log(`✅ Completed generating unique 6-digit IDs.`);
    }
  } catch (err) {
    console.error('❌ Error ensuring patient 6-digit IDs:', err);
  }
}

server.listen(port, () => {
  console.log(`🏥 HOSCORE API running on port ${port} (${process.env.NODE_ENV || 'development'})`);
  console.log(`🔌 WebSocket available at ws://localhost:${port}/ws`);
  ensurePatientSixDigitIds();
});

export { app, prisma };
