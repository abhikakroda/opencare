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

router.get('/', async (req, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const search = req.query.search?.toString().trim().toLowerCase();
  const { data, error } = await supabaseAdmin
    .from('medicines')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const items = (data ?? []).filter((medicine) => {
    if (!search) {
      return true;
    }

    const text = [medicine.name, medicine.generic_name, ...(medicine.brand_names ?? [])]
      .join(' ')
      .toLowerCase();

    return text.includes(search);
  });

  return res.json({ items });
});

router.patch('/:id', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'medicines', req.method);
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
      stock_qty: z.coerce.number().int().min(0),
      location: z.string().min(2),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid medicine update.' });
  }

  const { data, error } = await supabaseAdmin
    .from('medicines')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ item: data });
});

export default router;
