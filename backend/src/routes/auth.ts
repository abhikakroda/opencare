import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../lib/env.js';
import type { AppRole } from '../lib/rbac.js';
import { requireSupabase, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

const DEMO_USERS = [
  { email: 'admin@opencare.com', password: '123456', role: 'admin', full_name: 'Hospital Admin' },
  { email: 'staff@opencare.com', password: '123456', role: 'staff', full_name: 'Hospital Staff' },
  { email: 'nodal@opencare.com', password: '123456', role: 'nodal_officer', full_name: 'Nodal Officer' },
] as const;

type AdminUser = {
  email: string;
  password: string;
  role: AppRole;
  is_active: boolean;
};

const signAdminToken = (email: string, role: AppRole) =>
  jwt.sign({ role, email }, env.JWT_SECRET, { expiresIn: '12h' });

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
      access_role: z.enum(['admin', 'staff', 'nodal_officer']).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload.' });
  }

  const { email, password, access_role } = parsed.data;
  const user = await loadAdminUser(email);

  if (user) {
    if (!user.is_active) {
      return res.status(403).json({ message: 'Admin user is disabled.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect admin credentials.' });
    }

    if (access_role && user.role !== access_role) {
      return res.status(403).json({ message: 'Selected access role does not match this account.' });
    }

    const token = signAdminToken(email, user.role);
    return res.json({ token, profile: { email, role: user.role, sub_role: null } });
  }

  const envAdminMatches = email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD;
  if (envAdminMatches) {
    if (access_role && access_role !== 'admin') {
      return res.status(403).json({ message: 'Selected access role does not match this account.' });
    }

    const token = signAdminToken(email, 'admin');
    return res.json({ token, profile: { email, role: 'admin', sub_role: null } });
  }

  const demoUser = DEMO_USERS.find((item) => item.email === email && item.password === password);
  if (!demoUser) {
    return res.status(401).json({ message: 'Incorrect admin credentials.' });
  }

  if (access_role && access_role !== demoUser.role) {
    return res.status(403).json({ message: 'Selected access role does not match this account.' });
  }

  const token = signAdminToken(email, demoUser.role);
  return res.json({ token, profile: { email, role: demoUser.role, sub_role: null } });
});

export default router;
