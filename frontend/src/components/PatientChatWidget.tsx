import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircleHeart, Mic, Send, Volume2, X } from 'lucide-react';
import { api } from '../lib/api';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const isHindiText = (text: string) => /[\u0900-\u097F]/.test(text);
const FEMALE_VOICE_HINTS = ['female', 'woman', 'samantha', 'karen', 'serena', 'tessa', 'veena', 'zira', 'moira', 'susan', 'rashi'];

const pickPreferredVoice = (voices: SpeechSynthesisVoice[], wantsHindi: boolean) => {
  const languageVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(wantsHindi ? 'hi' : 'en-in') || voice.lang.toLowerCase().startsWith(wantsHindi ? 'hi' : 'en'),
  );

  const femaleVoice =
    languageVoices.find((voice) => FEMALE_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint))) ?? null;

  return femaleVoice ?? languageVoices[0] ?? null;
};

const starterMessages: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'Hi, I can help with queue, doctors, medicines, beds, machines, and scan support.',
  },
];

export const PatientChatWidget = () => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const pendingVoiceMessageRef = useRef('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [input, setInput] = useState('');
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [error, setError] = useState('');

  const history = useMemo(
    () => messages.filter((item) => item.role !== 'assistant' || item !== starterMessages[0]).slice(-8),
    [messages],
  );

  useEffect(() => {
    const speechApi = window.speechSynthesis;
    const syncVoices = () => {
      voicesRef.current = speechApi?.getVoices?.() ?? [];
    };

    syncVoices();
    speechApi?.addEventListener?.('voiceschanged', syncVoices);

    return () => {
      speechApi?.cancel();
      speechApi?.removeEventListener?.('voiceschanged', syncVoices);
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!pendingVoiceMessage || loading) {
      return;
    }

    setInput(pendingVoiceMessage);
  }, [pendingVoiceMessage, loading]);

  useEffect(() => {
    pendingVoiceMessageRef.current = pendingVoiceMessage;
  }, [pendingVoiceMessage]);

  const speakReply = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const wantsHindi = isHindiText(text);
    const matchedVoice = pickPreferredVoice(voicesRef.current, wantsHindi);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = wantsHindi ? 'hi-IN' : 'en-IN';
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) {
      return;
    }

    const nextMessages = [...messages, { role: 'user' as const, text }];
    setMessages(nextMessages);
    setInput('');
    setPendingVoiceMessage('');
    setLoading(true);
    setError('');

    try {
      const response = await api.post<{ reply: string }>('/chat/patient', {
        message: text,
        history,
      });

      setMessages((current) => [...current, { role: 'assistant', text: response.reply }]);
      speakReply(response.reply);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Chat is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleMic = () => {
    const SpeechRecognition =
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = isHindiText(input) ? 'hi-IN' : 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      const nextText = transcript.trim();
      setInput(nextText);
      if (nextText) {
        setPendingVoiceMessage(nextText);
      }
    };

    recognition.onerror = () => {
      setError('Voice input could not start.');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      if (pendingVoiceMessageRef.current.trim()) {
        void handleSend(pendingVoiceMessageRef.current);
      }
    };

    recognitionRef.current = recognition;
    setError('');
    setListening(true);
    recognition.start();
  };

  return (
    <div className="patient-chat">
      {open ? (
        <section className="patient-chat-panel">
          <header className="patient-chat-header">
            <div>
              <strong>Patient Help</strong>
              <span>Powered by Gemini</span>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className={voiceEnabled ? 'chat-close active' : 'chat-close'}
                onClick={() => setVoiceEnabled((current) => !current)}
                aria-label="Toggle voice replies"
              >
                <Volume2 size={16} />
              </button>
              <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close patient chat">
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="patient-chat-body">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                <p>{message.text}</p>
              </article>
            ))}
            {loading ? (
              <article className="chat-bubble assistant">
                <p>Thinking...</p>
              </article>
            ) : null}
          </div>

          {error ? <p className="error-text chat-error">{error}</p> : null}

          <div className="patient-chat-input">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask about queue, doctors, medicines..."
            />
            <button
              type="button"
              className={listening ? 'chat-mic active' : 'chat-mic'}
              onClick={handleMic}
              aria-label="Use voice input"
              title={listening ? 'Stop voice input' : 'Start voice input'}
            >
              <Mic size={16} />
            </button>
            <button type="button" onClick={() => void handleSend()} disabled={loading || !input.trim()} aria-label="Send chat message">
              <Send size={16} />
            </button>
          </div>
        </section>
      ) : null}

      <button type="button" className="patient-chat-trigger" onClick={() => setOpen((current) => !current)} aria-label="Open patient chat">
        <MessageCircleHeart size={18} />
        <span>Help</span>
      </button>
    </div>
  );
};
