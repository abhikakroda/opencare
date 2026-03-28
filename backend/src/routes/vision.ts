import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router, type Response } from 'express';
import multer from 'multer';
import { assertAdminMutationForResource } from '../lib/rbac.js';
import { env } from '../lib/env.js';
import type { AuthedRequest } from '../middleware/resolveUser.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const rbacError = (res: Response, error: unknown) => {
  const err = error as Error & { status?: number };
  return res.status(err.status ?? 500).json({ message: err.message });
};

router.post('/transcribe', upload.single('image'), async (req: AuthedRequest, res) => {
  try {
    assertAdminMutationForResource(req.authUser, 'vision', req.method);
  } catch (error) {
    return rbacError(res, error);
  }

  if (!env.GEMINI_API_KEY) {
    return res.status(400).json({ message: 'Gemini API key is not configured.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Image file is required.' });
  }

  try {
    const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString('base64'),
        },
      },
      `Read the medical image carefully.
Return strict JSON with keys:
transcription, summary, medicines, warnings.`,
    ]);

    return res.json({ result: result.response.text() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini transcription failed.';
    return res.status(500).json({ message });
  }
});

export default router;
