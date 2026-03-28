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

  const waitingCount = queue.filter((item) => item.status === 'waiting').length;
  const calledCount = queue.filter((item) => item.status === 'called').length;
  const doneCount = queue.filter((item) => item.status === 'done').length;
  const latestTokenTime = queue[0]?.created_at ? new Date(queue[0].created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'No live tokens';

  const loadQueue = async () => {
    setLoading(true);
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
      <div className="panel-heading" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Queue Control</p>
          <h2>Advance live tokens from one focused desk</h2>
          <p className="helper-text">Switch departments, call the next patient, and keep queue status updates in one compact workspace.</p>
          <div className="action-row" style={{ marginTop: '0.6rem' }}>
            <span className="badge">Department: {department}</span>
            <span className="badge queue-waiting">Waiting {waitingCount}</span>
            <span className="badge queue-called">Called {calledCount}</span>
            <span className="badge queue-done">Done {doneCount}</span>
          </div>
        </div>
        <div className="feature-grid" style={{ width: 'min(100%, 460px)', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          <article className="mini-stat">
            <strong>{queue.length}</strong>
            <span>Total shown</span>
          </article>
          <article className="mini-stat">
            <strong>{waitingCount + calledCount}</strong>
            <span>Active tokens</span>
          </article>
          <article className="mini-stat">
            <strong>{latestTokenTime}</strong>
            <span>Latest entry</span>
          </article>
        </div>
      </div>

      <div className="info-card" style={{ gap: '0.9rem', marginBottom: '1rem' }}>
        <div className="card-head" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Desk Action</p>
            <strong>Move the queue with one tap</strong>
            <p className="helper-text">Use the department selector to refresh live tokens, then call the next patient or finish the current one.</p>
          </div>
          <span className="badge badge-stock-ok">Realtime</span>
        </div>

        <div className="grid-form">
          <label className="form-field">
            <span>Department</span>
            <select value={department} disabled={readOnly} onChange={(event) => setDepartment(event.target.value)}>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="form-field">
            <span>Queue action</span>
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
        </div>

        <div className="action-row" style={{ marginTop: '0.15rem' }}>
          <span className="badge">Patients shown: {queue.length}</span>
          <span className="badge">Called: {calledCount}</span>
          <span className="badge">Done: {doneCount}</span>
        </div>
      </div>

      {message ? (
        <div className="empty-state" style={{ marginBottom: '0.9rem' }}>
          <strong>Action complete</strong>
          <p>{message}</p>
        </div>
      ) : null}
      {error ? (
        <div className="empty-state" style={{ marginBottom: '0.9rem' }}>
          <strong>Queue action failed</strong>
          <p>{error}</p>
        </div>
      ) : null}
      {loading ? (
        <div className="empty-state" style={{ marginBottom: '0.9rem' }}>
          <strong>Loading live queue</strong>
          <p>Fetching the latest token positions for {department}.</p>
        </div>
      ) : null}

      {!loading && queue.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: '0.9rem' }}>
          <strong>No queue items in this department.</strong>
          <p>New patient tokens will appear here automatically.</p>
        </div>
      ) : null}

      <div className="stack-list">
        {queue.map((item) => (
          <article key={item.id} className="queue-item" style={{ gap: '0.9rem' }}>
            <div className="card-head">
              <div>
                <strong>{item.token_number}</strong>
                <p>{item.patient_name}</p>
              </div>
              <span className={`badge queue-${item.status}`}>{item.status}</span>
            </div>
            <div className="action-row" style={{ marginTop: '-0.1rem' }}>
              <span className="badge">Department: {item.department}</span>
              <span className="badge">Queued at {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            {item.status !== 'done' ? (
              <div className="action-row">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    void handleAction(() => api.patch(`/queue/${item.id}/status`, { status: 'called' }, token), `${item.token_number} marked called`);
                  }}
                >
                  {item.status === 'called' ? 'Call Again' : 'Call'}
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
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};
