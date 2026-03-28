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
  const [department, setDepartment] = useState(departments[0]);
  const [queue, setQueue] = useState<QueueResponse>({
    items: [],
    summary: { waiting: 0, called: 0, done: 0, estimatedWaitMinutes: 0 },
  });
  const [latestToken, setLatestToken] = useState<{ token: string; position: number; eta: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadQueue = async () => {
    try {
      const data = await api.get<QueueResponse>(`/queue?department=${encodeURIComponent(department)}`);
      setQueue(data);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load queue');
    } finally {
      setInitialLoading(false);
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
    if (!patientName.trim()) {
      setMessage('Patient name is required.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post<{
        item: QueueItem;
        queuePosition: number;
        estimatedWaitMinutes: number;
      }>('/queue', { patient_name: patientName, department });

      setLatestToken({
        token: response.item.token_number,
        position: response.queuePosition,
        eta: response.estimatedWaitMinutes,
      });
      setPatientName('');
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

      <form className="grid-form" onSubmit={handleSubmit}>
        <input
          value={patientName}
          onChange={(event) => setPatientName(event.target.value)}
          placeholder="Patient full name"
          required
        />
        <select value={department} onChange={(event) => setDepartment(event.target.value)}>
          {departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
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

      {message ? <p className="error-text">{message}</p> : null}

      {initialLoading ? <p className="helper-text">Loading live queue...</p> : null}

      {!initialLoading && waitingList.length === 0 ? (
        <div className="empty-state">
          <strong>No active queue for this department.</strong>
          <p>Book the first token to start the live list.</p>
        </div>
      ) : null}

      <div className="queue-list">
        {waitingList.map((item, index) => (
          <article key={item.id} className="queue-item">
            <div>
              <strong>{item.token_number}</strong>
              <p>{item.patient_name}</p>
              <small>{item.department}</small>
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
