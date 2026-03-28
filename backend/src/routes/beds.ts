import { Router, type Response } from 'express';
import { z } from 'zod';
import { assertAdminMutationForResource } from '../lib/rbac.js';
import { requireSupabase } from '../lib/supabase.js';
import { requireOperationalUser } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/resolveUser.js';

const router = Router();

const rbacError = (res: Response, error: unknown) => {
  const err = error as Error & { status?: number };
  return res.status(err.status ?? 500).json({ message: err.message });
};

router.get('/', async (_req, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const { data, error } = await supabaseAdmin.from('beds').select('*').order('ward').order('bed_number');

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const items = data ?? [];
  return res.json({
    items,
    summary: {
      available: items.filter((bed) => bed.status === 'available').length,
      occupied: items.filter((bed) => bed.status === 'occupied').length,
      cleaning: items.filter((bed) => bed.status === 'cleaning').length,
    },
  });
});

router.post('/', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'beds', req.method);
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

  const parsed = z
    .object({
      ward: z.string().min(1),
      bed_number: z.string().min(1),
      status: z.enum(['available', 'occupied', 'cleaning']),
      patient_name: z.string().nullable().optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid bed payload.' });
  }

  const { data, error } = await supabaseAdmin
    .from('beds')
    .insert({
      ward: parsed.data.ward,
      bed_number: parsed.data.bed_number,
      status: parsed.data.status,
      patient_name: parsed.data.patient_name ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(201).json({ item: data });
});

router.patch('/:id', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'beds', req.method);
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

  const parsed = z
    .object({
      action: z.enum(['admit', 'discharge', 'cleaning']),
      patient_name: z.string().optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid bed action.' });
  }

  const updates =
    parsed.data.action === 'admit'
      ? { status: 'occupied', patient_name: parsed.data.patient_name ?? 'Admitted Patient' }
      : parsed.data.action === 'discharge'
        ? { status: 'available', patient_name: null }
        : { status: 'cleaning', patient_name: null };

  const { data, error } = await supabaseAdmin
    .from('beds')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ item: data });
});

export default router;
