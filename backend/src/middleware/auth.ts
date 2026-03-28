import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './resolveUser.js';

export const requireOperationalUser = (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.authUser) {
    return res.status(401).json({ message: 'Missing admin token.' });
  }

  if (req.authUser.role === 'patient') {
    return res.status(403).json({ message: 'Staff or admin access required.' });
  }

  if (req.authUser.role === 'nodal_officer') {
    return res.status(403).json({ message: 'Nodal officers have read-only access.' });
  }

  return next();
};

/** @deprecated Use AuthedRequest.authUser — kept for route files that import the name */
export type AdminRequest = AuthedRequest;

export const requireAdmin = requireOperationalUser;
