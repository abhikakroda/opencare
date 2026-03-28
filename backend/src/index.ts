import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import bedRoutes from './routes/beds.js';
import doctorRoutes from './routes/doctors.js';
import medicineRoutes from './routes/medicines.js';
import machineRoutes from './routes/machines.js';
import queueRoutes from './routes/queue.js';
import visionRoutes from './routes/vision.js';
import { env } from './lib/env.js';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/vision', visionRoutes);

app.listen(env.PORT, () => {
  console.log(`OpenCare backend listening on http://localhost:${env.PORT}`);
});
