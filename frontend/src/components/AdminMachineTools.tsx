import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Machine } from '../types';

export const AdminMachineTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { status: Machine['status']; quantity: string; location: string }>>({});
  const [form, setForm] = useState({
    name: '',
    category: '',
    location: '',
    quantity: '0',
    status: 'available',
    notes: '',
  });

  const loadMachines = async () => {
    try {
      const data = await api.get<{ items: Machine[] }>('/machines');
      setMachines(data.items);
      setDrafts(
        Object.fromEntries(
          data.items.map((machine) => [
            machine.id,
            { status: machine.status, quantity: String(machine.quantity), location: machine.location },
          ]),
        ),
      );
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load machines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMachines();
  }, []);

  useRealtimeTable('machines', () => {
    void loadMachines();
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/machines', { ...form, quantity: Number(form.quantity) }, token);
      setForm({
        name: '',
        category: '',
        location: '',
        quantity: '0',
        status: 'available',
        notes: '',
      });
      setMessage('Machine added');
      await loadMachines();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to add machine');
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Machine Control</p>
          <h2>Update hospital machine availability and quantity</h2>
        </div>
      </div>

      <form className="admin-create-form admin-form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field">
          <span>Machine name</span>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="MRI Scanner" required disabled={readOnly} />
        </label>
        <label className="form-field">
          <span>Category</span>
          <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Imaging" required disabled={readOnly} />
        </label>
        <label className="form-field">
          <span>Location</span>
          <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Radiology Floor 1" required disabled={readOnly} />
        </label>
        <label className="form-field">
          <span>Quantity</span>
          <input type="number" min="0" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="1" required disabled={readOnly} />
        </label>
        <label className="form-field">
          <span>Status</span>
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Machine['status'] }))} disabled={readOnly}>
            <option value="available">Available</option>
            <option value="in_use">In use</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </label>
        <label className="form-field form-field-wide">
          <span>Notes</span>
          <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Slot booking required" disabled={readOnly} />
        </label>
        <button type="submit" disabled={readOnly}>Add Machine</button>
      </form>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading machines...</p> : null}

      <div className="stack-list">
        {machines.map((machine) => (
          <article key={machine.id} className="info-card">
            <div className="card-head">
              <div>
                <strong>{machine.name}</strong>
                <p>{machine.location}</p>
              </div>
              <select
                value={drafts[machine.id]?.status ?? machine.status}
                disabled={readOnly}
                onChange={(event) => {
                  const value = event.target.value as Machine['status'];
                  setDrafts((current) => ({
                    ...current,
                    [machine.id]: { ...(current[machine.id] ?? { status: machine.status, quantity: String(machine.quantity), location: machine.location }), status: value },
                  }));
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
                value={drafts[machine.id]?.quantity ?? String(machine.quantity)}
                disabled={readOnly}
                onChange={(event) => {
                  const value = event.target.value;
                  setDrafts((current) => ({
                    ...current,
                    [machine.id]: { ...(current[machine.id] ?? { status: machine.status, quantity: String(machine.quantity), location: machine.location }), quantity: value },
                  }));
                }}
              />
              <input
                value={drafts[machine.id]?.location ?? machine.location}
                disabled={readOnly}
                onChange={(event) => {
                  const value = event.target.value;
                  setDrafts((current) => ({
                    ...current,
                    [machine.id]: { ...(current[machine.id] ?? { status: machine.status, quantity: String(machine.quantity), location: machine.location }), location: value },
                  }));
                }}
              />
              <button
                type="button"
                disabled={readOnly}
                onClick={() => {
                  void (async () => {
                    try {
                      setError('');
                      setMessage('');
                      const draft = drafts[machine.id] ?? { status: machine.status, quantity: String(machine.quantity), location: machine.location };
                      await api.patch(`/machines/${machine.id}`, {
                        status: draft.status,
                        quantity: Number(draft.quantity),
                        location: draft.location,
                      }, token);
                      setMessage(`${machine.name} updated`);
                      await loadMachines();
                    } catch (updateError) {
                      setError(updateError instanceof Error ? updateError.message : 'Unable to update machine');
                    }
                  })();
                }}
              >
                Save
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
