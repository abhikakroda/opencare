import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { requireSupabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
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

router.patch('/:id', requireAdmin, async (req, res) => {
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
