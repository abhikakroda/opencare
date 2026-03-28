import { Router, type Response } from 'express';
import { z } from 'zod';
import { assertAdminMutationForResource } from '../lib/rbac.js';
import { requireSupabase } from '../lib/supabase.js';
import { requireOperationalUser } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/resolveUser.js';

const router = Router();

const complaintSchema = z.object({
  patient_name: z.string().trim().min(2),
  phone: z.string().trim().max(32).optional().default(''),
  department: z.string().trim().min(2),
  subject: z.string().trim().min(3),
  message: z.string().trim().min(10),
});

const updateSchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved']),
  admin_note: z.string().trim().max(500).optional().default(''),
});

const rbacError = (res: Response, error: unknown) => {
  const err = error as Error & { status?: number };
  return res.status(err.status ?? 500).json({ message: err.message });
};

const isMissingComplaintsTable = (message: string) =>
  message.includes("Could not find the table 'public.complaints'") || message.includes('relation "public.complaints" does not exist');

router.get('/track', async (req, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const parsed = z
    .object({
      id: z.string().uuid(),
      phone: z.string().trim().max(32).optional(),
    })
    .safeParse({
      id: req.query.id,
      phone: req.query.phone,
    });

  if (!parsed.success) {
    return res.status(400).json({ message: 'Complaint ID is required for tracking.' });
  }

  const { data, error } = await supabaseAdmin
    .from('complaints')
    .select('id, patient_name, department, subject, status, admin_note, created_at, updated_at, phone')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (error) {
    if (isMissingComplaintsTable(error.message)) {
      return res.status(404).json({ message: 'Complaint tracking is not available yet.' });
    }
    return res.status(500).json({ message: error.message });
  }

  if (!data) {
    return res.status(404).json({ message: 'Complaint not found.' });
  }

  if (data.phone && parsed.data.phone && data.phone !== parsed.data.phone) {
    return res.status(403).json({ message: 'Phone number does not match this complaint.' });
  }

  return res.json({
    item: {
      id: data.id,
      patient_name: data.patient_name,
      department: data.department,
      subject: data.subject,
      status: data.status,
      admin_note: data.admin_note,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  });
});

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

  const status = req.query.status?.toString().trim();
  let query = supabaseAdmin.from('complaints').select('*').order('created_at', { ascending: false });

  if (status && ['open', 'in_review', 'resolved'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingComplaintsTable(error.message)) {
      return res.json({ items: [] });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.json({ items: data ?? [] });
});

router.post('/', async (req, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const parsed = complaintSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid complaint payload.' });
  }

  const payload = {
    ...parsed.data,
    phone: parsed.data.phone || null,
    status: 'open' as const,
    admin_note: '',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from('complaints').insert(payload).select().single();

  if (error) {
    if (isMissingComplaintsTable(error.message)) {
      return res.status(503).json({ message: 'Complaint storage is not available yet. Create the complaints table in Supabase first.' });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({ item: data });
});

router.patch('/:id', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'complaints', req.method);
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

  const parsed = updateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid complaint update.' });
  }

  const { data, error } = await supabaseAdmin
    .from('complaints')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (isMissingComplaintsTable(error.message)) {
      return res.status(503).json({ message: 'Complaint storage is not available yet. Create the complaints table in Supabase first.' });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.json({ item: data });
});

export default router;
