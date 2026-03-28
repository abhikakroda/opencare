import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(8),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  GEMINI_API_KEY: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  SUPABASE_URL: parsed.SUPABASE_URL || undefined,
  SUPABASE_SERVICE_ROLE_KEY: parsed.SUPABASE_SERVICE_ROLE_KEY || undefined,
};
