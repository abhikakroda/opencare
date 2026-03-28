import { useEffect, useState } from 'react';
import { departments } from '../config';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { QueueItem } from '../types';

export const AdminQueueTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [department, setDepartment] = useState(departments[0]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadQueue = async () => {
    try {
      const data = await api.get<{ items: QueueItem[] }>(`/queue?department=${encodeURIComponent(department)}`);
      setQueue(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, [department]);

  useRealtimeTable('queue_items', () => {
    void loadQueue();
  });

  const handleAction = async (runner: () => Promise<unknown>, successText: string) => {
    setError('');
    setMessage('');

    try {
      await runner();
      setMessage(successText);
      await loadQueue();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed');
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Queue Control</p>
          <h2>Advance live tokens without the rest of the admin tools getting in the way</h2>
        </div>
      </div>

      <div className="grid-form">
        <select value={department} disabled={readOnly} onChange={(event) => setDepartment(event.target.value)}>
          {departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => {
            void handleAction(() => api.post('/queue/call-next', { department }, token), 'Next patient called');
          }}
        >
          Call Next
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading department queue...</p> : null}

      {!loading && queue.length === 0 ? (
        <div className="empty-state">
          <strong>No queue items in this department.</strong>
          <p>New patient tokens will appear here automatically.</p>
        </div>
      ) : null}

      <div className="stack-list">
        {queue.map((item) => (
          <article key={item.id} className="queue-item">
            <div>
              <strong>{item.token_number}</strong>
              <p>{item.patient_name}</p>
            </div>
            <div className="action-row">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => {
                  void handleAction(() => api.patch(`/queue/${item.id}/status`, { status: 'called' }, token), `${item.token_number} marked called`);
                }}
              >
                Call
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => {
                  void handleAction(() => api.patch(`/queue/${item.id}/status`, { status: 'done' }, token), `${item.token_number} marked done`);
                }}
              >
                Done
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
