import type { AuthUser } from './rbac.js';
import { isFullAdmin } from './rbac.js';

function forbidden(message: string): Error {
  const err = new Error(message);
  (err as Error & { status: number }).status = 403;
  return err;
}

/** When authenticated, only doctor, staff, nodal, patient, or full admins may call the doctors directory. */
export function forbiddenIfNotDoctorDirectory(user: AuthUser | null | undefined): void {
  if (!user) {
    return;
  }
  if (user.role === 'nodal_officer' || user.role === 'staff' || user.role === 'patient') {
    return;
  }
  if (isFullAdmin(user)) {
    return;
  }
  if (user.role === 'admin' && user.sub_role === 'doctor_admin') {
    return;
  }
  throw forbidden('Not allowed to access the doctors directory.');
}
