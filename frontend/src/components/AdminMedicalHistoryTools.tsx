import { FileClock, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { departments } from '../config';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { MedicalHistory } from '../types';

const initialForm = {
  patient_name: '',
  phone: '',
  visit_date: new Date().toISOString().slice(0, 10),
  department: departments[0] ?? 'General Medicine',
  diagnosis: '',
  medicines: '',
  allergies: '',
  notes: '',
  recorded_by: 'Hospital Staff',
};

export const AdminMedicalHistoryTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const totalRecords = items.length;
  const uniquePatients = useMemo(() => new Set(items.map((item) => item.phone || item.patient_name)).size, [items]);
  const latestVisit = useMemo(() => items[0]?.visit_date ?? '', [items]);

  const loadItems = async () => {
    try {
      const data = await api.get<{ items: MedicalHistory[] }>('/medical-history', token);
      setItems(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load medical history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  useRealtimeTable('medical_histories', () => {
    void loadItems();
  });

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.post(
        '/medical-history',
        {
          ...form,
          medicines: form.medicines.split(',').map((item) => item.trim()).filter(Boolean),
          allergies: form.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        },
        token,
      );
      setMessage('Medical history entry added.');
      setForm(initialForm);
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save medical history');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Medical History Desk</p>
          <h2>Add and review past medical history records manually</h2>
          <p className="helper-text">Fill the patient details once, save the record, and use the list below to review older visits.</p>
        </div>
        <FileClock size={28} />
      </div>

      <div className="token-card" style={{ marginBottom: '1rem' }}>
        <span className="token-label">History snapshot</span>
        <strong>{totalRecords} history record{totalRecords === 1 ? '' : 's'} saved</strong>
        <div className="action-row" style={{ marginTop: '0.25rem' }}>
          <span className="badge">Patients {uniquePatients}</span>
          <span className="badge">Latest {latestVisit ? new Date(latestVisit).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>

      <div className="admin-form-grid" style={{ marginBottom: '1rem' }}>
        <div className="card-head">
          <div>
            <p className="eyebrow">Add Record</p>
            <strong>Create a new medical history entry</strong>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Keep the entry compact and complete so the history timeline stays readable.
            </p>
          </div>
          <Plus size={18} />
        </div>

        <div
          className="complaint-form-grid"
          style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          <label className="form-field">
            <span>Patient Name</span>
            <input value={form.patient_name} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))} />
          </label>
          <label className="form-field">
            <span>Mobile Number</span>
            <input value={form.phone} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label className="form-field">
            <span>Visit Date</span>
            <input type="date" value={form.visit_date} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, visit_date: event.target.value }))} />
          </label>
          <label className="form-field">
            <span>Department</span>
            <select value={form.department} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}>
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </label>
          <label className="form-field form-field-wide">
            <span>Diagnosis</span>
            <input value={form.diagnosis} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))} placeholder="Main diagnosis or treatment summary" />
          </label>
          <label className="form-field">
            <span>Medicines</span>
            <input value={form.medicines} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, medicines: event.target.value }))} placeholder="Comma separated medicines" />
          </label>
          <label className="form-field">
            <span>Allergies</span>
            <input value={form.allergies} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, allergies: event.target.value }))} placeholder="Comma separated allergies" />
          </label>
          <label className="form-field">
            <span>Recorded By</span>
            <input value={form.recorded_by} disabled={readOnly} onChange={(event) => setForm((current) => ({ ...current, recorded_by: event.target.value }))} />
          </label>
          <label className="form-field form-field-wide">
            <span>Notes</span>
            <textarea value={form.notes} disabled={readOnly} rows={4} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Extra notes, recurring issues, procedure details, or discharge comments" />
          </label>
        </div>

        <div className="action-row">
          <button type="button" disabled={readOnly || saving} onClick={() => void handleCreate()}>
            <Plus size={16} />
            {saving ? 'Saving...' : 'Add History'}
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </div>

      {loading ? <p className="helper-text">Loading past history...</p> : null}

      {!loading && items.length === 0 ? (
        <div className="empty-state">
          <strong>No medical history saved yet.</strong>
          <p>Staff can add the first patient history record from this page.</p>
        </div>
      ) : null}

      <div className="stack-list">
        {items.map((item) => (
          <article key={item.id} className="history-card">
            <div className="card-head">
              <div>
                <strong>{item.patient_name}</strong>
                <p>{item.phone} · {item.department}</p>
              </div>
              <span className="badge complaint-resolved">{new Date(item.visit_date).toLocaleDateString()}</span>
            </div>
            <div className="action-row" style={{ marginTop: '0.1rem' }}>
              <span className="badge">Recorded by {item.recorded_by}</span>
              <span className="badge">Medicines {item.medicines.length}</span>
              <span className="badge">Allergies {item.allergies.length}</span>
            </div>
            <div className="stack-list" style={{ marginTop: '0.25rem' }}>
              <p><strong>Diagnosis:</strong> {item.diagnosis}</p>
              <p><strong>Medicines:</strong> {item.medicines.join(', ') || 'Not recorded'}</p>
              <p><strong>Allergies:</strong> {item.allergies.join(', ') || 'None noted'}</p>
              <p><strong>Notes:</strong> {item.notes || 'No extra notes'}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
