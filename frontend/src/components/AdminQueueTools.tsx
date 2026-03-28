import { useEffect, useState } from 'react';
import { departments } from '../config';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { QueueItem } from '../types';

export const AdminQueueTools = ({ token }: { token: string }) => {
  const [department, setDepartment] = useState(departments[0]);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const loadQueue = async () => {
    const data = await api.get<{ items: QueueItem[] }>(`/queue?department=${encodeURIComponent(department)}`);
    setQueue(data.items);
  };

  useEffect(() => {
    void loadQueue();
  }, [department]);

  useRealtimeTable('queue_items', () => {
    void loadQueue();
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Queue Control</p>
          <h2>Advance live tokens without the rest of the admin tools getting in the way</h2>
        </div>
      </div>

      <div className="grid-form">
        <select value={department} onChange={(event) => setDepartment(event.target.value)}>
          {departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            void api.post('/queue/call-next', { department }, token).then(() => loadQueue());
          }}
        >
          Call Next
        </button>
      </div>

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
                onClick={() => {
                  void api.patch(`/queue/${item.id}/status`, { status: 'called' }, token).then(() => loadQueue());
                }}
              >
                Call
              </button>
              <button
                type="button"
                onClick={() => {
                  void api.patch(`/queue/${item.id}/status`, { status: 'done' }, token).then(() => loadQueue());
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
