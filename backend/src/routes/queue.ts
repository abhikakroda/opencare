import { Router, type Response } from 'express';
import { z } from 'zod';
import { assertAdminMutationForResource } from '../lib/rbac.js';
import { requireSupabase } from '../lib/supabase.js';
import { buildTokenNumber, estimateWaitMinutes } from '../lib/token.js';
import { requireOperationalUser } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/resolveUser.js';

const router = Router();

const rbacError = (res: Response, error: unknown) => {
  const err = error as Error & { status?: number };
  return res.status(err.status ?? 500).json({ message: err.message });
};

const isMissingQueueProfileColumns = (message: string) =>
  message.includes("Could not find the 'aadhaar_number' column") ||
  message.includes("Could not find the 'patient_phone' column") ||
  message.includes("Could not find the 'patient_age' column") ||
  message.includes("Could not find the 'patient_gender' column") ||
  message.includes('column "aadhaar_number" does not exist') ||
  message.includes('column "patient_phone" does not exist') ||
  message.includes('column "patient_age" does not exist') ||
  message.includes('column "patient_gender" does not exist');

const isMissingQueueTable = (message: string) =>
  message.includes("Could not find the table 'public.queue_items'") || message.includes('relation "public.queue_items" does not exist');

router.get('/', async (req: AuthedRequest, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const department = req.query.department?.toString();
  let query = supabaseAdmin.from('queue_items').select('*').order('created_at', { ascending: true });

  if (department) {
    query = query.eq('department', department);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingQueueTable(error.message)) {
      return res.status(503).json({ message: 'Queue storage is not available yet. Create the queue_items table in Supabase first.' });
    }
    return res.status(500).json({ message: error.message });
  }

  const items = data ?? [];
  return res.json({
    items,
    summary: {
      waiting: items.filter((item) => item.status === 'waiting').length,
      called: items.filter((item) => item.status === 'called').length,
      done: items.filter((item) => item.status === 'done').length,
      estimatedWaitMinutes: estimateWaitMinutes(items.filter((item) => item.status === 'waiting').length),
    },
  });
});

router.post('/', async (req: AuthedRequest, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const parsed = z
    .object({
      patient_name: z.string().trim().min(2),
      department: z.string().trim().min(2),
      patient_phone: z.string().trim().min(10).max(20),
      patient_age: z.coerce.number().int().min(0).max(120),
      patient_gender: z.enum(['male', 'female', 'other']),
      aadhaar_number: z
        .string()
        .trim()
        .min(12)
        .max(16)
        .optional()
        .or(z.literal(''))
        .transform(value => value || null),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid queue payload.' });
  }

  const { count, error: countError } = await supabaseAdmin
    .from('queue_items')
    .select('*', { count: 'exact', head: true })
    .eq('department', parsed.data.department);

  if (countError) {
    if (isMissingQueueTable(countError.message)) {
      return res.status(503).json({ message: 'Queue storage is not available yet. Create the queue_items table in Supabase first.' });
    }
    return res.status(500).json({ message: countError.message });
  }

  const tokenNumber = buildTokenNumber(parsed.data.department, (count ?? 0) + 1);
  const { data, error } = await supabaseAdmin
    .from('queue_items')
    .insert({
      patient_name: parsed.data.patient_name,
      department: parsed.data.department,
      patient_phone: parsed.data.patient_phone,
      patient_age: parsed.data.patient_age,
      patient_gender: parsed.data.patient_gender,
      aadhaar_number: parsed.data.aadhaar_number,
      token_number: tokenNumber,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) {
    if (isMissingQueueTable(error.message)) {
      return res.status(503).json({ message: 'Queue storage is not available yet. Create the queue_items table in Supabase first.' });
    }
    if (isMissingQueueProfileColumns(error.message)) {
      return res.status(503).json({
        message: 'Queue profile fields are not available yet. Add Aadhaar, mobile, age, and gender columns to queue_items in Supabase first.',
      });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({
    item: data,
    queuePosition: (count ?? 0) + 1,
    estimatedWaitMinutes: estimateWaitMinutes(count ?? 0),
  });
});

router.post('/call-next', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'queue', req.method);
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

  const parsed = z.object({ department: z.string().min(2) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Department is required.' });
  }

  const { data: nextPatient, error: fetchError } = await supabaseAdmin
    .from('queue_items')
    .select('*')
    .eq('department', parsed.data.department)
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    if (isMissingQueueTable(fetchError.message)) {
      return res.status(503).json({ message: 'Queue storage is not available yet. Create the queue_items table in Supabase first.' });
    }
    return res.status(500).json({ message: fetchError.message });
  }

  if (!nextPatient) {
    return res.status(404).json({ message: 'No waiting patient in this department.' });
  }

  const { data, error } = await supabaseAdmin
    .from('queue_items')
    .update({ status: 'called', called_at: new Date().toISOString() })
    .eq('id', nextPatient.id)
    .select()
    .single();

  if (error) {
    if (isMissingQueueTable(error.message)) {
      return res.status(503).json({ message: 'Queue storage is not available yet. Create the queue_items table in Supabase first.' });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.json({ item: data });
});

router.patch('/:id/status', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'queue', req.method);
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

  const parsed = z.object({ status: z.enum(['waiting', 'called', 'done']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid queue status.' });
  }

  const payload: Record<string, string | null> = { status: parsed.data.status };
  if (parsed.data.status === 'done') {
    payload.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('queue_items')
    .update(payload)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    if (isMissingQueueTable(error.message)) {
      return res.status(503).json({ message: 'Queue storage is not available yet. Create the queue_items table in Supabase first.' });
    }
    return res.status(500).json({ message: error.message });
  }

  return res.json({ item: data });
});

export default router;
