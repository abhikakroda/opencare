import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import bedRoutes from './routes/beds.js';
import chatRoutes from './routes/chat.js';
import complaintRoutes from './routes/complaints.js';
import doctorRoutes from './routes/doctors.js';
import medicineRoutes from './routes/medicines.js';
import machineRoutes from './routes/machines.js';
import medicalHistoryRoutes from './routes/medicalHistory.js';
import queueRoutes from './routes/queue.js';
import visionRoutes from './routes/vision.js';
import { env } from './lib/env.js';
import { attachAuthUser, type AuthedRequest } from './middleware/resolveUser.js';

const app = express();

const allowedOrigins = new Set([
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

const isAllowedOrigin = (origin: string) => {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const hostname = new URL(origin).hostname;
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  }),
);

app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  void attachAuthUser(req as AuthedRequest, res, next);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);
app.use('/api/vision', visionRoutes);

export default app;
