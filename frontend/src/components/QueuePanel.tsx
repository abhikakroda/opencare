import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Clock3, Ticket } from 'lucide-react';
import { departments } from '../config';
import { api } from '../lib/api';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import type { QueueItem } from '../types';
import { StatusBadge } from './StatusBadge';

type QueueResponse = {
  items: QueueItem[];
  summary: {
    waiting: number;
    called: number;
    done: number;
    estimatedWaitMinutes: number;
  };
};

export const QueuePanel = () => {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [department, setDepartment] = useState(departments[0]);
  const [queue, setQueue] = useState<QueueResponse>({
    items: [],
    summary: { waiting: 0, called: 0, done: 0, estimatedWaitMinutes: 0 },
  });
  const [latestToken, setLatestToken] = useState<{ token: string; position: number; eta: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const loadQueue = async () => {
    setRefreshing(true);
    try {
      const data = await api.get<QueueResponse>(`/queue?department=${encodeURIComponent(department)}`);
      setQueue(data);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load queue');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, [department]);

  useRealtimeTable('queue_items', () => {
    void loadQueue();
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanedName = patientName.trim();
    const cleanedPhone = patientPhone.trim();
    const cleanedAadhaar = aadhaarNumber.trim();
    const ageValue = Number(patientAge);

    if (cleanedName.length < 2) {
      setMessage('Please enter the patient full name.');
      return;
    }
    if (!/^\d{10}$/.test(cleanedPhone)) {
      setMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!Number.isFinite(ageValue) || ageValue <= 0 || ageValue > 120) {
      setMessage('Please enter a valid age.');
      return;
    }
    if (cleanedAadhaar && !/^\d{12,16}$/.test(cleanedAadhaar)) {
      setMessage('Please enter a valid Aadhaar number or leave it blank.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post<{
        item: QueueItem;
        queuePosition: number;
        estimatedWaitMinutes: number;
      }>('/queue', {
        patient_name: cleanedName,
        patient_phone: cleanedPhone,
        patient_age: ageValue,
        patient_gender: patientGender,
        aadhaar_number: cleanedAadhaar,
        department,
      });

      setLatestToken({
        token: response.item.token_number,
        position: response.queuePosition,
        eta: response.estimatedWaitMinutes,
      });
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setPatientGender('male');
      setAadhaarNumber('');
      setMessage(`Token ${response.item.token_number} generated successfully.`);
      await loadQueue();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create token');
    } finally {
      setLoading(false);
    }
  };

  const waitingList = queue.items.filter((item) => item.status !== 'done');
  const queueStats = [
    { label: 'Waiting', value: queue.summary.waiting },
    { label: 'Called', value: queue.summary.called },
    { label: 'Done', value: queue.summary.done },
  ];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Smart Queue</p>
          <h2>Book a token and follow the live queue</h2>
          <p className="hero-text">Choose your department, generate a token, and see the current line in real time.</p>
        </div>
        <div className="stat-row">
          <div className="mini-stat">
            <Clock3 size={18} />
            <span>{queue.summary.estimatedWaitMinutes} min wait</span>
          </div>
          <div className="mini-stat">
            <Ticket size={18} />
            <span>{queue.items.length} live tokens</span>
          </div>
        </div>
      </div>

      <div className="stat-row" style={{ marginBottom: '1rem' }}>
        {queueStats.map((item) => (
          <div key={item.label} className="mini-stat">
            <Ticket size={18} />
            <span>
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>

      <form className="grid-form queue-booking-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Patient full name</span>
          <input
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            placeholder="Patient full name"
            required
          />
        </label>
        <label className="form-field">
          <span>Mobile number</span>
          <input
            value={patientPhone}
            onChange={(event) => setPatientPhone(event.target.value)}
            placeholder="10-digit mobile number"
            inputMode="tel"
            maxLength={15}
            required
          />
        </label>
        <label className="form-field">
          <span>Age</span>
          <input
            value={patientAge}
            onChange={(event) => setPatientAge(event.target.value)}
            placeholder="Age"
            inputMode="numeric"
            min="1"
            max="120"
            required
          />
        </label>
        <label className="form-field">
          <span>Gender</span>
          <select value={patientGender} onChange={(event) => setPatientGender(event.target.value as 'male' | 'female' | 'other')}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="form-field">
          <span>Aadhaar card number</span>
          <input
            value={aadhaarNumber}
            onChange={(event) => setAadhaarNumber(event.target.value)}
            placeholder="Optional Aadhaar number"
            inputMode="numeric"
            maxLength={16}
          />
        </label>
        <label className="form-field">
          <span>Department</span>
          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Generating token...' : 'Get Token'}
        </button>
      </form>

      {latestToken ? (
        <div className="token-card">
          <span className="token-label">Your Token</span>
          <strong>{latestToken.token}</strong>
          <span>Queue position {latestToken.position}</span>
          <span>Estimated wait {latestToken.eta} minutes</span>
        </div>
      ) : null}

      {message ? (
        <div className="empty-state">
          <strong>Queue update</strong>
          <p>{message}</p>
        </div>
      ) : null}

      {initialLoading || refreshing ? (
        <div className="empty-state">
          <strong>{initialLoading ? 'Loading live queue' : 'Refreshing queue'}</strong>
          <p>{initialLoading ? 'Fetching the current line for this department.' : 'Updating patient positions and summary counts.'}</p>
        </div>
      ) : null}

      {!initialLoading && waitingList.length === 0 ? (
        <div className="empty-state">
          <strong>No active queue for this department.</strong>
          <p>Book the first token to start the live list.</p>
        </div>
      ) : null}

      <div className="queue-list">
        {waitingList.map((item, index) => (
          <article key={item.id} className="queue-item" style={{ gap: '0.75rem' }}>
            <div>
              <strong>{item.token_number}</strong>
              <p>{item.patient_name}</p>
              <small>
                {item.department}
                {item.patient_age ? ` · ${item.patient_age} yrs` : ''}
                {item.patient_gender ? ` · ${item.patient_gender}` : ''}
              </small>
            </div>
            <div className="queue-meta">
              <span>#{index + 1} in line</span>
              <StatusBadge tone={item.status} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
