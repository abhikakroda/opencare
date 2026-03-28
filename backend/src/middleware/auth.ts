import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';

type AdminPayload = {
  role: 'admin';
  email: string;
};

export type AdminRequest = Request & {
  admin?: AdminPayload;
};

export const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing admin token.' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminPayload;

    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
