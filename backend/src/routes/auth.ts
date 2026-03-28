import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../lib/env.js';

const router = Router();

router.post('/login', (req, res) => {
  const parsed = z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload.' });
  }

  const { email, password } = parsed.data;
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Incorrect admin credentials.' });
  }

  const token = jwt.sign({ role: 'admin', email }, env.JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token, profile: { email, role: 'admin' } });
});

export default router;
