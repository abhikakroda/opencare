/**
 * Route access rules (Vite SPA). Used by NavigationSentinel in App.
 * Mirrors backend RBAC intent: scoped admins only reach their workspaces.
 */

export type AppRole = 'patient' | 'staff' | 'admin' | 'nodal_officer';
export type SubRole = 'doctor_admin' | 'medical_admin' | 'bed_admin';

export type AuthProfile = {
  role: AppRole;
  sub_role: SubRole | null;
  email: string | null;
};

const PUBLIC_PATHS = new Set(['/', '/queue', '/medicines', '/beds', '/doctors', '/machines', '/scan', '/login']);

function matches(pathname: string, bases: string[]) {
  return bases.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function getHomePathForUser(profile: AuthProfile | null): string {
  if (!profile) {
    return '/';
  }
  if (profile.role === 'nodal_officer') {
    return '/nodal';
  }
  if (profile.role === 'staff') {
    return '/staff';
  }
  if (profile.role === 'admin' && profile.sub_role === 'doctor_admin') {
    return '/admin/doctor';
  }
  if (profile.role === 'admin' && profile.sub_role === 'medical_admin') {
    return '/admin/medical';
  }
  if (profile.role === 'admin' && profile.sub_role === 'bed_admin') {
    return '/admin/beds';
  }
  if (profile.role === 'admin') {
    return '/admin';
  }
  return '/';
}

/**
 * Returns whether the current path is allowed; otherwise a redirect target.
 */
export function evaluateRouteAccess(
  pathname: string,
  hasSession: boolean,
  profile: AuthProfile | null,
): { ok: true } | { ok: false; redirectTo: string } {
  if (PUBLIC_PATHS.has(pathname)) {
    return { ok: true };
  }

  const protectedRoot = ['/admin', '/staff', '/nodal'];
  const needsAuth = protectedRoot.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!needsAuth) {
    return { ok: true };
  }

  if (!hasSession) {
    return { ok: false, redirectTo: '/' };
  }

  if (!profile) {
    return { ok: false, redirectTo: '/' };
  }

  if (profile.role === 'nodal_officer') {
    return { ok: true };
  }

  if (profile.role === 'patient') {
    return { ok: false, redirectTo: '/' };
  }

  if (profile.role === 'staff') {
    if (matches(pathname, ['/admin', '/staff', '/nodal'])) {
      return { ok: true };
    }
    return { ok: false, redirectTo: '/staff' };
  }

  if (profile.role === 'admin' && profile.sub_role == null) {
    return { ok: true };
  }

  if (profile.role === 'admin' && profile.sub_role === 'doctor_admin') {
    if (matches(pathname, ['/admin/doctor', '/admin/doctors', '/admin/machines', '/staff/queue'])) {
      return { ok: true };
    }
    return { ok: false, redirectTo: '/admin/doctor' };
  }

  if (profile.role === 'admin' && profile.sub_role === 'medical_admin') {
    if (matches(pathname, ['/admin/medical', '/staff/medicines'])) {
      return { ok: true };
    }
    return { ok: false, redirectTo: '/admin/medical' };
  }

  if (profile.role === 'admin' && profile.sub_role === 'bed_admin') {
    if (matches(pathname, ['/admin/beds', '/staff/beds'])) {
      return { ok: true };
    }
    return { ok: false, redirectTo: '/admin/beds' };
  }

  return { ok: false, redirectTo: '/admin' };
}

export function legacyPathRedirect(pathname: string, profile: AuthProfile | null): string | null {
  if (!profile || profile.role !== 'admin' || profile.sub_role == null) {
    return null;
  }
  if (profile.sub_role === 'doctor_admin' && (pathname === '/admin/queue' || pathname.startsWith('/admin/queue'))) {
    return '/staff/queue';
  }
  if (profile.sub_role === 'medical_admin' && (pathname === '/admin/pharmacy' || pathname.startsWith('/admin/pharmacy'))) {
    return '/staff/medicines';
  }
  return null;
}
