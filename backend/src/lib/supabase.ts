import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabaseAdmin =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export const requireSupabase = () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.');
  }

  return supabaseAdmin;
};
