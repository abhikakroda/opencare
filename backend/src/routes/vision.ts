import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router } from 'express';
import multer from 'multer';
import { env } from '../lib/env.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', upload.single('image'), async (req, res) => {
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
