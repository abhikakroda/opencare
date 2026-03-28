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
  const availableCount = beds.filter((bed) => bed.status === 'available').length;
  const occupiedCount = beds.filter((bed) => bed.status === 'occupied').length;
  const cleaningCount = beds.filter((bed) => bed.status === 'cleaning').length;

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
          <p className="helper-text">Add a bed above, then use each ward card to admit, discharge, or mark a bed for cleaning.</p>
        </div>
      </div>

      <div className="token-card" style={{ marginBottom: '1rem' }}>
        <span className="token-label">Live ward snapshot</span>
        <strong>{beds.length} beds across {wards.length || 0} wards</strong>
        <div className="action-row" style={{ marginTop: '0.25rem' }}>
          <span className="badge">Available {availableCount}</span>
          <span className="badge">Occupied {occupiedCount}</span>
          <span className="badge">Cleaning {cleaningCount}</span>
        </div>
      </div>

      <form className="admin-create-form admin-form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field">
          <span>Ward</span>
          <input value={form.ward} onChange={(event) => setForm((current) => ({ ...current, ward: event.target.value }))} placeholder="Ward A" required disabled={readOnly} />
        </label>
        <label className="form-field">
          <span>Bed number</span>
          <input value={form.bed_number} onChange={(event) => setForm((current) => ({ ...current, bed_number: event.target.value }))} placeholder="A-04" required disabled={readOnly} />
        </label>
        <label className="form-field">
          <span>Status</span>
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Bed['status'] }))} disabled={readOnly}>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="cleaning">Cleaning</option>
          </select>
        </label>
        <label className="form-field form-field-wide">
          <span>Patient name</span>
          <input value={form.patient_name} onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))} placeholder="Only if occupied" disabled={readOnly} />
        </label>
        <button type="submit" disabled={readOnly}>Add Bed</button>
      </form>

      <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.9rem' }}>
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <p className="helper-text">Loading beds...</p> : null}
      </div>

      <div className="grid-form" style={{ marginTop: '0.9rem' }}>
        <label className="form-field">
          <span>Patient name for admit action</span>
          <input
            value={patientName}
            disabled={readOnly}
            onChange={(event) => setPatientName(event.target.value)}
            placeholder="Patient name"
          />
        </label>
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {wards.length ? wards.map((ward) => {
          const wardBeds = beds.filter((bed) => bed.ward === ward);

          return (
            <article key={ward} className="admin-form-grid" style={{ display: 'grid', gap: '0.9rem' }}>
              <div className="card-head">
                <div>
                  <strong>{ward}</strong>
                  <p>{wardBeds.length} bed{wardBeds.length === 1 ? '' : 's'} in this ward</p>
                </div>
                <span className="badge">Ward</span>
              </div>

              <div className="bed-grid">
                {wardBeds.map((bed) => (
                  <article key={bed.id} className={`bed-card bed-${bed.status}`}>
                    <div className="card-head" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <strong>{bed.bed_number}</strong>
                        <p>{bed.patient_name ?? 'Vacant'}</p>
                      </div>
                      <span className={`badge bed-badge bed-${bed.status}`}>{bed.status.replace('_', ' ')}</span>
                    </div>
                    <div className="action-stack" style={{ marginTop: '0.35rem' }}>
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
            </article>
          );
        }) : (
          <div className="empty-state">
            <strong>No wards found yet.</strong>
            <p>Add a bed first to start grouping wards and managing admissions.</p>
          </div>
        )}
      </div>
    </section>
  );
};
