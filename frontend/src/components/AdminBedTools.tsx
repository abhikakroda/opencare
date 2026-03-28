import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Bed } from '../types';

export const AdminBedTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patientName, setPatientName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ward: '',
    bed_number: '',
    status: 'available',
    patient_name: '',
  });

  const loadBeds = async () => {
    try {
      const data = await api.get<{ items: Bed[] }>('/beds');
      setBeds(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load beds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBeds();
  }, []);

  useRealtimeTable('beds', () => {
    void loadBeds();
  });

  const wards = useMemo(() => Array.from(new Set(beds.map((bed) => bed.ward))), [beds]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post(
        '/beds',
        {
          ward: form.ward,
          bed_number: form.bed_number,
          status: form.status,
          patient_name: form.patient_name || null,
        },
        token,
      );

      setForm({ ward: '', bed_number: '', status: 'available', patient_name: '' });
      setMessage('Bed added');
      await loadBeds();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to add bed');
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Bed Actions</p>
          <h2>Handle admissions and turnover on a clean ward management page</h2>
        </div>
      </div>

      <form className="admin-create-form" onSubmit={(event) => void handleSubmit(event)}>
        <input value={form.ward} onChange={(event) => setForm((current) => ({ ...current, ward: event.target.value }))} placeholder="Ward name" required disabled={readOnly} />
        <input value={form.bed_number} onChange={(event) => setForm((current) => ({ ...current, bed_number: event.target.value }))} placeholder="Bed number" required disabled={readOnly} />
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Bed['status'] }))} disabled={readOnly}>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="cleaning">Cleaning</option>
        </select>
        <input value={form.patient_name} onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))} placeholder="Patient name if occupied" disabled={readOnly} />
        <button type="submit" disabled={readOnly}>Add Bed</button>
      </form>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading beds...</p> : null}

      <input
        value={patientName}
        disabled={readOnly}
        onChange={(event) => setPatientName(event.target.value)}
        placeholder="Patient name for admit action"
      />

      {wards.map((ward) => (
        <div key={ward} className="ward-section">
          <h3>{ward}</h3>
          <div className="bed-grid">
            {beds.filter((bed) => bed.ward === ward).map((bed) => (
              <article key={bed.id} className={`bed-card bed-${bed.status}`}>
                <strong>{bed.bed_number}</strong>
                <small>{bed.patient_name ?? 'Vacant'}</small>
                <div className="action-stack">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      void (async () => {
                        try {
                          setError('');
                          setMessage('');
                          await api.patch(`/beds/${bed.id}`, { action: 'admit', patient_name: patientName || 'Admitted Patient' }, token);
                          setMessage(`${bed.bed_number} admitted`);
                          await loadBeds();
                        } catch (actionError) {
                          setError(actionError instanceof Error ? actionError.message : 'Unable to update bed');
                        }
                      })();
                    }}
                  >
                    Admit
                  </button>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      void (async () => {
                        try {
                          setError('');
                          setMessage('');
                          await api.patch(`/beds/${bed.id}`, { action: 'discharge' }, token);
                          setMessage(`${bed.bed_number} discharged`);
                          await loadBeds();
                        } catch (actionError) {
                          setError(actionError instanceof Error ? actionError.message : 'Unable to update bed');
                        }
                      })();
                    }}
                  >
                    Discharge
                  </button>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      void (async () => {
                        try {
                          setError('');
                          setMessage('');
                          await api.patch(`/beds/${bed.id}`, { action: 'cleaning' }, token);
                          setMessage(`${bed.bed_number} marked cleaning`);
                          await loadBeds();
                        } catch (actionError) {
                          setError(actionError instanceof Error ? actionError.message : 'Unable to update bed');
                        }
                      })();
                    }}
                  >
                    Cleaning
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};
