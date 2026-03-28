import { Router, type Response } from 'express';
import { z } from 'zod';
import { assertAdminMutationForResource } from '../lib/rbac.js';
import { requireSupabase } from '../lib/supabase.js';
import { requireOperationalUser } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/resolveUser.js';

const router = Router();

const createSchema = z.object({
  patient_name: z.string().trim().min(2),
  phone: z.string().trim().min(10).max(20),
  visit_date: z.string().trim().min(8),
  department: z.string().trim().min(2),
  diagnosis: z.string().trim().min(3),
  medicines: z.array(z.string().trim()).default([]),
  allergies: z.array(z.string().trim()).default([]),
  notes: z.string().trim().default(''),
  recorded_by: z.string().trim().min(2),
});

const verifySchema = z.object({
  phone: z.string().trim().min(10).max(20),
  otp: z.string().trim().length(4),
});

const rbacError = (res: Response, error: unknown) => {
  const err = error as Error & { status?: number };
  return res.status(err.status ?? 500).json({ message: err.message });
};

const isMissingMedicalHistoriesTable = (message: string) =>
  message.includes("Could not find the table 'public.medical_histories'") || message.includes('relation "public.medical_histories" does not exist');

router.get('/', async (req: AuthedRequest, res) => {
  if (!req.authUser) {
    return res.status(401).json({ message: 'Missing admin token.' });
  }

  if (req.authUser.role === 'patient') {
    return res.status(403).json({ message: 'Staff or admin access required.' });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const phone = req.query.phone?.toString().trim();
  let query = supabaseAdmin.from('medical_histories').select('*').order('visit_date', { ascending: false });

  if (phone) {
    query = query.eq('phone', phone);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingMedicalHistoriesTable(error.message)) {
      return res.json({ items: [] });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.json({ items: data ?? [] });
});

router.post('/', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'medical_history', req.method);
  } catch (error) {
    return rbacError(res, error);
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid medical history payload.' });
  }

  const payload = {
    ...parsed.data,
    medicines: parsed.data.medicines.filter(Boolean),
    allergies: parsed.data.allergies.filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from('medical_histories').insert(payload).select().single();

  if (error) {
    if (isMissingMedicalHistoriesTable(error.message)) {
      return res.status(503).json({ message: 'Medical history storage is not available yet. Create the medical_histories table in Supabase first.' });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({ item: data });
});

router.post('/verify', async (req, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const parsed = verifySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Phone and 4-digit OTP are required.' });
  }

  if (parsed.data.otp !== '1234') {
    return res.status(401).json({ message: 'Invalid demo OTP. Use 1234 for showcase.' });
  }

  const { data, error } = await supabaseAdmin
    .from('medical_histories')
    .select('*')
    .eq('phone', parsed.data.phone)
    .order('visit_date', { ascending: false });

  if (error) {
    if (isMissingMedicalHistoriesTable(error.message)) {
      return res.json({
        verified: true,
        demoOtp: '1234',
        items: [],
      });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.json({
    verified: true,
    demoOtp: '1234',
    items: data ?? [],
  });
});

export default router;
