import { Router, type Response } from 'express';
import { z } from 'zod';
import { assertAdminMutationForResource } from '../lib/rbac.js';
import { forbiddenIfNotDoctorDirectory } from '../lib/routeGuards.js';
import { requireSupabase } from '../lib/supabase.js';
import { requireOperationalUser } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/resolveUser.js';

const router = Router();

const rbacError = (res: Response, error: unknown) => {
  const err = error as Error & { status?: number };
  return res.status(err.status ?? 500).json({ message: err.message });
};

router.get('/', async (req: AuthedRequest, res) => {
  try {
    forbiddenIfNotDoctorDirectory(req.authUser);
  } catch (err) {
    const e = err as Error & { status?: number };
    return res.status(e.status ?? 403).json({ message: e.message });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = requireSupabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Supabase is not configured.';
    return res.status(503).json({ message });
  }

  const department = req.query.department?.toString().trim().toLowerCase();
  const search = req.query.search?.toString().trim().toLowerCase();

  const { data, error } = await supabaseAdmin.from('doctors').select('*').order('department').order('name');
  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const items = (data ?? []).filter((doctor) => {
    const matchesDepartment = department ? doctor.department.toLowerCase().includes(department) : true;
    const matchesSearch = search
      ? `${doctor.name} ${doctor.specialization} ${doctor.department}`.toLowerCase().includes(search)
      : true;

    return matchesDepartment && matchesSearch;
  });

  return res.json({ items });
});

router.patch('/:id', requireOperationalUser, async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'doctors', req.method);
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
      status: z.enum(['available', 'busy', 'off_duty']),
      next_slot: z.string().min(1),
      room: z.string().min(1),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid doctor update.' });
  }

  const { data, error } = await supabaseAdmin
    .from('doctors')
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
