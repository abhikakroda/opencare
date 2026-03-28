import { useEffect, useState } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Machine } from '../types';

export const AdminMachineTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [machines, setMachines] = useState<Machine[]>([]);

  const loadMachines = async () => {
    const data = await api.get<{ items: Machine[] }>('/machines');
    setMachines(data.items);
  };

  useEffect(() => {
    void loadMachines();
  }, []);

  useRealtimeTable('machines', () => {
    void loadMachines();
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Machine Control</p>
          <h2>Update hospital machine availability and quantity</h2>
        </div>
      </div>

      <div className="stack-list">
        {machines.map((machine) => (
          <article key={machine.id} className="info-card">
            <div className="card-head">
              <div>
                <strong>{machine.name}</strong>
                <p>{machine.location}</p>
              </div>
              <select
                defaultValue={machine.status}
                disabled={readOnly}
                onChange={(event) => {
                  if (readOnly) {
                    return;
                  }
                  void api.patch(`/machines/${machine.id}`, {
                    status: event.target.value,
                    quantity: machine.quantity,
                    location: machine.location,
                  }, token).then(() => loadMachines());
                }}
              >
                <option value="available">Available</option>
                <option value="in_use">In use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="grid-form">
              <input
                type="number"
                min="0"
                defaultValue={machine.quantity}
                disabled={readOnly}
                onBlur={(event) => {
                  if (readOnly) {
                    return;
                  }
                  void api.patch(`/machines/${machine.id}`, {
                    status: machine.status,
                    quantity: Number(event.target.value),
                    location: machine.location,
                  }, token).then(() => loadMachines());
                }}
              />
              <input
                defaultValue={machine.location}
                disabled={readOnly}
                onBlur={(event) => {
                  if (readOnly) {
                    return;
                  }
                  void api.patch(`/machines/${machine.id}`, {
                    status: machine.status,
                    quantity: machine.quantity,
                    location: event.target.value,
                  }, token).then(() => loadMachines());
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
