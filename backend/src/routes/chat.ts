import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../lib/env.js';
import { requireSupabase } from '../lib/supabase.js';

const router = Router();

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().min(1).max(2000),
});

type ChatLanguage = 'hindi' | 'hinglish' | 'english';

const extractTokens = (message: string) =>
  Array.from(message.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu), (match) => match[0]).filter((token) => token.length > 1);

const SEARCH_STOPWORDS = new Set([
  'is',
  'are',
  'the',
  'a',
  'an',
  'available',
  'please',
  'tell',
  'about',
  'me',
  'my',
  'hai',
  'kya',
  'abhi',
  'mujhe',
  'ye',
  'this',
  'that',
]);

const buildKeywords = (message: string) => extractTokens(message).filter((token) => !SEARCH_STOPWORDS.has(token));

const matchesKeywords = (text: string, keywords: string[]) =>
  keywords.length > 0 && keywords.some((keyword) => text.toLowerCase().includes(keyword));

const hinglishWords = [
  'hai', 'hain', 'tha', 'thi', 'the',
  'kya', 'kyun', 'kaise', 'kab', 'kahan', 'kaun',
  'mujhe', 'meri', 'mera', 'mere',
  'aur', 'ya', 'lekin', 'par', 'toh',
  'nahi', 'mat', 'na',
  'hoga', 'hogi', 'hoge',
  'kar', 'karo', 'karna', 'karta', 'karti',
  'hua', 'hui', 'hue',
  'batao', 'bata', 'bataye',
  'chahiye', 'chahta', 'chahti',
  'accha', 'theek', 'sahi',
  'bohot', 'bahut', 'zyada', 'thoda',
  'abhi', 'baad', 'pehle',
  'ghar', 'kaam', 'din', 'raat',
  'main', 'hum', 'aap', 'tum', 'wo', 'yeh',
  'yahan', 'wahan',
  'dard', 'dawa', 'dawai', 'bukhar', 'bukhaar',
  'khansii', 'khansi', 'zukam', 'jukam',
  'pet', 'sar', 'sir', 'aankhein', 'kamar',
  'dil', 'sans', 'khoon', 'blood',
  'doctor', 'dawakhana', 'hospital', 'ilaj',
  'takleef', 'bimari', 'bimaari', 'mareez',
  'symptoms', 'tabiyat', 'sehat',
  'khana', 'peena', 'neend', 'uthna',
  'chot', 'chota', 'ghav', 'sujan',
  'injection', 'tablet', 'capsule', 'syrup',
  'ultrasound', 'xray', 'test', 'report',
  'dard ho raha', 'bukhar hai', 'pet mein',
  'sar dard', 'kamzori', 'thakan', 'chakkar',
  'ulti', 'jalan', 'khujli', 'soojan',
  'neend nahi', 'bhookh nahi', 'zyada thakan',
  'kya karu', 'kya karein', 'kya hoga',
  'kaise theek', 'kab theek', 'kya lena',
  'kya khana', 'kya peena', 'doctor ko',
  'kitni dawa', 'kab tak',
];

const HINGLISH_HINTS = new Set(hinglishWords);

const SYSTEM_PROMPT = `You are OpenCare Patient Assistant for a hospital app.
You help with queue, medicines, doctors, machines, beds, scan, and hospital navigation.
Use live hospital data directly whenever available.
Never expose internal technical details that are not patient-safe.
Do not claim a confirmed diagnosis.
If the situation sounds urgent, tell the patient to contact hospital staff or emergency services immediately.
Strict language rule:
- If user writes in Devanagari Hindi, reply only in Hindi (Devanagari).
- If user writes in Hinglish / roman Hindi, reply only in Hinglish (roman Hindi).
- If user writes in English, reply only in English.
- Do not switch script unless the user does.
Keep replies short, calm, practical, and easy for patients to understand.
Use plain text only.`;

const detectLanguage = (text: string): ChatLanguage => {
  const lower = text.toLowerCase();

  if (/[\u0900-\u097F]/.test(text)) {
    return 'hindi';
  }

  const tokens = extractTokens(text);
  const foundWords = hinglishWords.filter((word) => {
    const normalized = word.toLowerCase();
    if (normalized.includes(' ')) {
      return lower.includes(normalized);
    }

    return tokens.includes(normalized);
  });
  if (foundWords.length >= 1) {
    return 'hinglish';
  }

  return 'english';
};

const getLanguageInstruction = (text: string) => {
  const lang = detectLanguage(text);

  const instructions: Record<ChatLanguage, string> = {
    hindi: 'तुम एक medical assistant हो। हमेशा शुद्ध हिंदी में जवाब दो।',
    hinglish: 'You are a medical assistant. Reply in Hinglish (Roman Hindi mixed with English).',
    english: 'You are a medical assistant. Reply in English only.',
  };

  return instructions[lang];
};

const buildPrompt = ({
  promptContext,
  historyText,
  userMessage,
}: {
  promptContext: string;
  historyText: string;
  userMessage: string;
}) => {
  return `${SYSTEM_PROMPT}
${getLanguageInstruction(userMessage)}
${promptContext}
${historyText ? `Conversation so far:\n${historyText}\n` : ''}User: ${userMessage}`;
};

const createHospitalContext = async (message: string, language: ChatLanguage) => {
  const supabase = requireSupabase();
  const query = message.toLowerCase();
  const keywords = buildKeywords(message);

  const [queueRes, bedRes, doctorRes, machineRes, medicineRes] = await Promise.all([
    supabase.from('queue_items').select('department, token_number, status').order('created_at', { ascending: true }),
    supabase.from('beds').select('ward, bed_number, status'),
    supabase.from('doctors').select('name, department, specialization, status, room, next_slot').order('department').order('name'),
    supabase.from('machines').select('name, category, location, quantity, status, notes').order('category').order('name'),
    supabase.from('medicines').select('name, generic_name, stock_qty, location, alternatives').order('updated_at', { ascending: false }),
  ]);

  const errors = [queueRes.error, bedRes.error, doctorRes.error, machineRes.error, medicineRes.error].filter(Boolean);
  if (errors.length) {
    throw new Error(errors[0]?.message ?? 'Failed to load hospital data.');
  }

  const queueItems = queueRes.data ?? [];
  const beds = bedRes.data ?? [];
  const doctors = doctorRes.data ?? [];
  const machines = machineRes.data ?? [];
  const medicines = medicineRes.data ?? [];

  const waitingByDepartment = Array.from(
    queueItems
      .filter((item) => item.status === 'waiting')
      .reduce((map, item) => {
        map.set(item.department, (map.get(item.department) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
  )
    .map(([department, waiting]) =>
      language === 'hindi' ? `${department}: ${waiting} प्रतीक्षा में` : language === 'hinglish' ? `${department}: ${waiting} wait mein` : `${department}: ${waiting} waiting`,
    )
    .slice(0, 8);

  const relevantDoctors = doctors
    .filter((item) => matchesKeywords(`${item.name} ${item.department} ${item.specialization}`, keywords))
    .slice(0, 6)
    .map((item) =>
      language === 'hindi'
        ? `${item.name} ${item.department} में ${item.status} हैं। कमरा: ${item.room}। अगला स्लॉट: ${item.next_slot}।`
        : language === 'hinglish'
          ? `${item.name} ${item.department} mein ${item.status} hain. Room: ${item.room}. Agla slot: ${item.next_slot}.`
        : `${item.name} is ${item.status} in ${item.department}. Room: ${item.room}. Next slot: ${item.next_slot}.`,
    );

  const relevantMachines = machines
    .filter((item) => matchesKeywords(`${item.name} ${item.category} ${item.location} ${item.notes}`, keywords))
    .slice(0, 6)
    .map((item) =>
      language === 'hindi'
        ? `${item.name} अभी ${item.status} है। कृपया अंतिम पुष्टि अस्पताल स्टाफ से करें।`
        : language === 'hinglish'
          ? `${item.name} abhi ${item.status} hai. Final confirm hospital staff se kar lein.`
        : `${item.name} is currently ${item.status}. Please confirm the final status with hospital staff.`,
    );

  const relevantMedicines = medicines
    .filter((item) => matchesKeywords(`${item.name} ${item.generic_name} ${item.location}`, keywords))
    .slice(0, 6)
    .map((item) =>
      language === 'hindi'
        ? `${item.name} अभी ${item.stock_qty > 0 ? 'उपलब्ध है' : 'उपलब्ध नहीं है'}।`
        : language === 'hinglish'
          ? `${item.name} abhi ${item.stock_qty > 0 ? 'available hai' : 'available nahi hai'}.`
        : `${item.name} is ${item.stock_qty > 0 ? 'available' : 'not available'} right now.`,
    );

  const bedSummary = {
    available: beds.filter((item) => item.status === 'available').length,
    occupied: beds.filter((item) => item.status === 'occupied').length,
    cleaning: beds.filter((item) => item.status === 'cleaning').length,
  };

  const factualAnswerParts: string[] = [];
  const hasDoctorMatch = relevantDoctors.length > 0;
  const hasMachineMatch = relevantMachines.length > 0;
  const hasMedicineMatch = relevantMedicines.length > 0;

  if (query.includes('doctor') || query.includes('cardiology') || query.includes('pediatrics') || query.includes('orthopedic') || hasDoctorMatch) {
    factualAnswerParts.push(
      hasDoctorMatch
        ? language === 'hindi'
          ? `मुझे यह डॉक्टर जानकारी मिली:\n- ${relevantDoctors.join('\n- ')}`
          : language === 'hinglish'
            ? `Mujhe yeh doctor details mili:\n- ${relevantDoctors.join('\n- ')}`
          : `Here are the doctor details I found:\n- ${relevantDoctors.join('\n- ')}`
        : language === 'hindi'
          ? 'इस सवाल के लिए कोई डॉक्टर जानकारी नहीं मिली।'
          : language === 'hinglish'
            ? 'Is sawal ke liye koi doctor detail nahi mili.'
          : 'No doctor details matched this question right now.',
    );
  }

  if (query.includes('machine') || query.includes('mri') || query.includes('ct') || query.includes('ventilator') || query.includes('dialysis') || hasMachineMatch) {
    factualAnswerParts.push(
      hasMachineMatch
        ? language === 'hindi'
          ? `मुझे यह मशीन जानकारी मिली:\n- ${relevantMachines.join('\n- ')}`
          : language === 'hinglish'
            ? `Mujhe yeh machine details mili:\n- ${relevantMachines.join('\n- ')}`
          : `Here are the machine details I found:\n- ${relevantMachines.join('\n- ')}`
        : language === 'hindi'
          ? 'इस सवाल के लिए कोई मशीन जानकारी नहीं मिली।'
          : language === 'hinglish'
            ? 'Is sawal ke liye koi machine detail nahi mili.'
          : 'No machine details matched this question right now.',
    );
  }

  if (query.includes('medicine') || query.includes('stock') || query.includes('tablet') || query.includes('injection') || hasMedicineMatch) {
    factualAnswerParts.push(
      hasMedicineMatch
        ? relevantMedicines[0]
        : language === 'hindi'
          ? 'यह दवा अभी रिकॉर्ड में नहीं मिली। कृपया अस्पताल फार्मेसी डेस्क से जांच करें।'
          : language === 'hinglish'
            ? 'Yeh dawa abhi record mein nahi mili. Kripya hospital pharmacy desk se check karein.'
          : 'I could not find this medicine in the current record. Please check with the hospital pharmacy desk.',
    );
  }

  if (query.includes('bed') || query.includes('ward')) {
    factualAnswerParts.push(
      language === 'hindi'
        ? `अभी बेड स्थिति: ${bedSummary.available} उपलब्ध, ${bedSummary.occupied} भरे हुए, ${bedSummary.cleaning} सफाई में हैं।`
        : language === 'hinglish'
          ? `Abhi bed status: ${bedSummary.available} available, ${bedSummary.occupied} occupied, ${bedSummary.cleaning} cleaning mein hain.`
        : `Current bed status: ${bedSummary.available} available, ${bedSummary.occupied} occupied, ${bedSummary.cleaning} under cleaning.`,
    );
  }

  if (query.includes('queue') || query.includes('token') || query.includes('wait')) {
    factualAnswerParts.push(
      language === 'hindi'
        ? `अभी कतार स्थिति: ${waitingByDepartment.join('; ') || 'कोई सक्रिय प्रतीक्षा कतार नहीं है'}।`
        : language === 'hinglish'
          ? `Abhi queue status: ${waitingByDepartment.join('; ') || 'koi active waiting queue nahi hai'}.`
        : `Current queue status: ${waitingByDepartment.join('; ') || 'there is no active waiting queue right now'}.`,
    );
  }

  return {
    directFacts: factualAnswerParts,
    promptContext: `
${language === 'hindi' ? 'अस्पताल का लाइव डेटा:' : language === 'hinglish' ? 'Hospital ka live data:' : 'Live hospital data:'}
- ${language === 'hindi' ? 'कतार सारांश' : language === 'hinglish' ? 'Queue summary' : 'Queue summary'}: ${waitingByDepartment.join('; ') || (language === 'hindi' ? 'कोई सक्रिय प्रतीक्षा कतार नहीं है' : language === 'hinglish' ? 'koi active waiting queue nahi hai' : 'no active waiting queue')}
- ${language === 'hindi' ? 'बेड सारांश' : language === 'hinglish' ? 'Bed summary' : 'Bed summary'}: ${
      language === 'hindi'
        ? `${bedSummary.available} उपलब्ध, ${bedSummary.occupied} भरे हुए, ${bedSummary.cleaning} सफाई में`
        : language === 'hinglish'
          ? `${bedSummary.available} available, ${bedSummary.occupied} occupied, ${bedSummary.cleaning} cleaning mein`
        : `${bedSummary.available} available, ${bedSummary.occupied} occupied, ${bedSummary.cleaning} cleaning`
    }
- ${language === 'hindi' ? 'डॉक्टर मिलान' : language === 'hinglish' ? 'Doctor matches' : 'Doctor matches'}: ${relevantDoctors.join(' || ') || (language === 'hindi' ? 'कोई डॉक्टर मिलान नहीं' : language === 'hinglish' ? 'koi doctor match nahi' : 'no doctor match')}
- ${language === 'hindi' ? 'मशीन मिलान' : language === 'hinglish' ? 'Machine matches' : 'Machine matches'}: ${relevantMachines.join(' || ') || (language === 'hindi' ? 'कोई मशीन मिलान नहीं' : language === 'hinglish' ? 'koi machine match nahi' : 'no machine match')}
- ${language === 'hindi' ? 'दवा मिलान' : language === 'hinglish' ? 'Medicine matches' : 'Medicine matches'}: ${relevantMedicines.join(' || ') || (language === 'hindi' ? 'कोई दवा मिलान नहीं' : language === 'hinglish' ? 'koi medicine match nahi' : 'no medicine match')}
${language === 'hindi' ? 'पहले इन तथ्यों का उपयोग करें:' : language === 'hinglish' ? 'Pehle in facts ka use karein:' : 'Use these facts first:'}
${factualAnswerParts.join('\n') || (language === 'hindi' ? 'ऊपर दिए गए लाइव डेटा से जवाब दें।' : language === 'hinglish' ? 'Upar diye gaye live hospital data se jawab dein.' : 'Answer from the live hospital data above.')}
`,
  };
};

router.post('/patient', async (req, res) => {
  const language = detectLanguage(req.body?.message ?? '');

  if (!env.GEMINI_API_KEY) {
    return res.status(400).json({
      message:
        language === 'hindi'
          ? 'Gemini API key configure नहीं है।'
          : language === 'hinglish'
            ? 'Gemini API key configure nahi hai.'
            : 'Gemini API key is not configured.',
    });
  }

  const parsed = z
    .object({
      message: z.string().min(1).max(2000),
      history: z.array(MessageSchema).max(12).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message:
        language === 'hindi' ? 'Chat payload invalid है।' : language === 'hinglish' ? 'Chat payload invalid hai.' : 'Invalid chat payload.',
    });
  }

  try {
    const hospitalContext = await createHospitalContext(parsed.data.message, language);
    if (hospitalContext.directFacts.length > 0) {
      return res.json({ reply: hospitalContext.directFacts.join('\n') });
    }

    const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const historyText = (parsed.data.history ?? [])
      .map((item) => `${item.role === 'user' ? 'Patient' : 'Assistant'}: ${item.text}`)
      .join('\n');

    const result = await model.generateContent([buildPrompt({
      promptContext: hospitalContext.promptContext,
      historyText,
      userMessage: parsed.data.message,
    })]);

    return res.json({ reply: result.response.text().trim() });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : language === 'hindi'
          ? 'Gemini chat fail हो गया।'
          : language === 'hinglish'
            ? 'Gemini chat fail ho gaya.'
            : 'Gemini chat failed.';
    return res.status(500).json({ message });
  }
});

export default router;
