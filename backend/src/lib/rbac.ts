export type AppRole = 'patient' | 'staff' | 'admin' | 'nodal_officer';
export type SubRole = 'doctor_admin' | 'medical_admin' | 'bed_admin';

export type AuthUser = {
  role: AppRole;
  sub_role: SubRole | null;
  email: string | null;
  source: 'legacy' | 'supabase';
};

export function isFullAdmin(user: AuthUser): boolean {
  return user.role === 'admin' && user.sub_role == null;
}

export function parseAppRole(value: unknown): AppRole | null {
  if (value === 'patient' || value === 'staff' || value === 'admin' || value === 'nodal_officer') {
    return value;
  }
  return null;
}

export function parseSubRole(value: unknown): SubRole | null {
  if (value === 'doctor_admin' || value === 'medical_admin' || value === 'bed_admin') {
    return value;
  }
  return null;
}

function forbidden(message: string): Error {
  const err = new Error(message);
  (err as Error & { status: number }).status = 403;
  return err;
}

/**
 * Enforces mutation rules when a Bearer identity is present.
 * Anonymous requests skip this (public endpoints stay public).
 */
export function assertAdminMutationForResource(
  user: AuthUser | null | undefined,
  resource: 'queue' | 'medicines' | 'beds' | 'vision' | 'doctors' | 'machines' | 'complaints' | 'medical_history',
  method: string,
): void {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }

  if (!user) {
    return;
  }

  if (user.role === 'nodal_officer') {
    throw forbidden('Nodal officers may only perform read operations.');
  }

  if (user.role === 'staff' || isFullAdmin(user)) {
    return;
  }

  if (user.role === 'patient') {
    throw forbidden('Patients cannot perform this action.');
  }

  if (user.role === 'admin' && user.sub_role) {
    if (resource === 'vision') {
      throw forbidden('This admin role cannot modify that resource.');
    }

    const sub = user.sub_role;
    const can =
      (sub === 'doctor_admin' && (resource === 'queue' || resource === 'doctors' || resource === 'machines')) ||
      (sub === 'medical_admin' && (resource === 'medicines' || resource === 'medical_history')) ||
      (sub === 'bed_admin' && resource === 'beds');

    if (!can) {
      throw forbidden('This admin role cannot modify that resource.');
    }
  }
}
