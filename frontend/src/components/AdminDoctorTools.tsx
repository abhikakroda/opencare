import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Doctor } from '../types';

export const AdminDoctorTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { status: Doctor['status']; room: string; next_slot: string }>>({});
  const [form, setForm] = useState({
    name: '',
    department: '',
    specialization: '',
    status: 'available',
    room: '',
    next_slot: '',
  });

  const loadDoctors = async () => {
    try {
      const data = await api.get<{ items: Doctor[] }>('/doctors');
      setDoctors(data.items);
      setDrafts(
        Object.fromEntries(
          data.items.map((doctor) => [
            doctor.id,
            { status: doctor.status, room: doctor.room, next_slot: doctor.next_slot },
          ]),
        ),
      );
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctors();
  }, []);

  useRealtimeTable('doctors', () => {
    void loadDoctors();
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/doctors', form, token);
      setForm({
        name: '',
        department: '',
        specialization: '',
        status: 'available',
        room: '',
        next_slot: '',
      });
      setMessage('Doctor added');
      await loadDoctors();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to add doctor');
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Doctor Control</p>
          <h2>Update doctor status, room, and next slot</h2>
        </div>
      </div>

      <form className="admin-create-form" onSubmit={(event) => void handleSubmit(event)}>
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Doctor name" required disabled={readOnly} />
        <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="Department" required disabled={readOnly} />
        <input value={form.specialization} onChange={(event) => setForm((current) => ({ ...current, specialization: event.target.value }))} placeholder="Specialization" required disabled={readOnly} />
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Doctor['status'] }))} disabled={readOnly}>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="off_duty">Off duty</option>
        </select>
        <input value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))} placeholder="Room" required disabled={readOnly} />
        <input value={form.next_slot} onChange={(event) => setForm((current) => ({ ...current, next_slot: event.target.value }))} placeholder="Next slot" required disabled={readOnly} />
        <button type="submit" disabled={readOnly}>Add Doctor</button>
      </form>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading doctors...</p> : null}

      <div className="stack-list">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="info-card">
            <div className="card-head">
              <div>
                <strong>{doctor.name}</strong>
                <p>{doctor.department}</p>
              </div>
              <select
                value={drafts[doctor.id]?.status ?? doctor.status}
                disabled={readOnly}
                onChange={(event) => {
                  const value = event.target.value as Doctor['status'];
                  setDrafts((current) => ({
                    ...current,
                    [doctor.id]: { ...(current[doctor.id] ?? { status: doctor.status, room: doctor.room, next_slot: doctor.next_slot }), status: value },
                  }));
                }}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off duty</option>
              </select>
            </div>
            <div className="grid-form">
              <input
                value={drafts[doctor.id]?.room ?? doctor.room}
                disabled={readOnly}
                onChange={(event) => {
                  const value = event.target.value;
                  setDrafts((current) => ({
                    ...current,
                    [doctor.id]: { ...(current[doctor.id] ?? { status: doctor.status, room: doctor.room, next_slot: doctor.next_slot }), room: value },
                  }));
                }}
              />
              <input
                value={drafts[doctor.id]?.next_slot ?? doctor.next_slot}
                disabled={readOnly}
                onChange={(event) => {
                  const value = event.target.value;
                  setDrafts((current) => ({
                    ...current,
                    [doctor.id]: { ...(current[doctor.id] ?? { status: doctor.status, room: doctor.room, next_slot: doctor.next_slot }), next_slot: value },
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
                      await api.patch(`/doctors/${doctor.id}`, drafts[doctor.id] ?? { status: doctor.status, room: doctor.room, next_slot: doctor.next_slot }, token);
                      setMessage(`${doctor.name} updated`);
                      await loadDoctors();
                    } catch (updateError) {
                      setError(updateError instanceof Error ? updateError.message : 'Unable to update doctor');
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
