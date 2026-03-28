import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../lib/env.js';
import { requireSupabase, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const DEMO_ADMIN_EMAIL = 'admin@opencare.com';
const DEMO_ADMIN_PASSWORD = '123456';

type AdminUser = {
  email: string;
  password: string;
  role: 'admin' | 'staff';
  is_active: boolean;
};

const signAdminToken = (email: string) => jwt.sign({ role: 'admin', email }, env.JWT_SECRET, { expiresIn: '12h' });

const loadAdminUser = async (email: string): Promise<AdminUser | null> => {
  if (!supabaseAdmin) {
    return null;
  }

  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('admin_users')
      .select('email, password, role, is_active')
      .eq('email', email)
      .maybeSingle<AdminUser>();

    if (error) {
      return null;
    }

    return data ?? null;
  } catch {
    return null;
  }
};

router.post('/login', async (req, res) => {
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
  const user = await loadAdminUser(email);

  if (user) {
    if (!user.is_active) {
      return res.status(403).json({ message: 'Admin user is disabled.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect admin credentials.' });
    }

    const token = signAdminToken(email);
    return res.json({ token, profile: { email, role: user.role, sub_role: null } });
  }

  const matchesEnvAdmin = email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD;
  const matchesDemoAdmin = email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD;

  if (!matchesEnvAdmin && !matchesDemoAdmin) {
    return res.status(401).json({ message: 'Incorrect admin credentials.' });
  }

  const token = signAdminToken(email);
  return res.json({ token, profile: { email, role: 'admin', sub_role: null } });
});

export default router;
