import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import type { AuthUser } from '../lib/rbac.js';
import { parseAppRole, parseSubRole } from '../lib/rbac.js';
import { requireSupabase } from '../lib/supabase.js';

type LegacyJwtPayload = {
  role?: string;
  sub_role?: string | null;
  email?: string;
};

export type AuthedRequest = Request & {
  authUser?: AuthUser | null;
};

async function resolveFromSupabaseToken(token: string): Promise<AuthUser | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  let client;
  try {
    client = requireSupabase();
  } catch {
    return null;
  }
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  const user = data.user;
  const meta = user.user_metadata ?? {};
  const role = parseAppRole(meta.role) ?? 'patient';
  const sub_role = parseSubRole(meta.sub_role);

  return {
    role,
    sub_role: role === 'admin' ? sub_role : null,
    email: user.email ?? null,
    source: 'supabase',
  };
}

function resolveFromLegacyJwt(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as LegacyJwtPayload;
    const role = parseAppRole(payload.role);
    if (!role) {
      return null;
    }

    return {
      role,
      sub_role: role === 'admin' ? parseSubRole(payload.sub_role ?? null) : null,
      email: payload.email ?? null,
      source: 'legacy',
    };
  } catch {
    return null;
  }
}

export async function attachAuthUser(req: AuthedRequest, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.authUser = null;
    return next();
  }

  const token = header.replace('Bearer ', '').trim();
  if (!token) {
    req.authUser = null;
    return next();
  }

  const legacyUser = resolveFromLegacyJwt(token);
  if (legacyUser) {
    req.authUser = legacyUser;
    return next();
  }

  try {
    const supabaseUser = await resolveFromSupabaseToken(token);
    req.authUser = supabaseUser;
  } catch {
    req.authUser = null;
  }

  return next();
}
