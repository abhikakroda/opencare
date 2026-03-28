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

  const search = req.query.search?.toString().trim().toLowerCase();
  const { data, error } = await supabaseAdmin.from('machines').select('*').order('category').order('name');

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const items = (data ?? []).filter((machine) => {
    if (!search) {
      return true;
    }

    return `${machine.name} ${machine.category} ${machine.location}`.toLowerCase().includes(search);
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
      status: z.enum(['available', 'in_use', 'maintenance']),
      quantity: z.coerce.number().int().min(0),
      location: z.string().min(1),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid machine update.' });
  }

  const { data, error } = await supabaseAdmin
    .from('machines')
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
