import { MessageSquareWarning, Send } from 'lucide-react';
import { useState } from 'react';
import { departments } from '../config';
import { api } from '../lib/api';
import type { Complaint } from '../types';

const initialForm = {
  patient_name: '',
  phone: '',
  department: departments[0] ?? 'General',
  subject: '',
  message: '',
};

export const ComplaintPanel = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [trackId, setTrackId] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const complaintStatusLabel = (status: Complaint['status']) => status.replace('_', ' ');

  const handleSubmit = async () => {
    const patientName = form.patient_name.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (patientName.length < 2) {
      setError('Patient name must be at least 2 characters.');
      setSuccess('');
      return;
    }

    if (subject.length < 3) {
      setError('Subject must be at least 3 characters.');
      setSuccess('');
      return;
    }

    if (message.length < 10) {
      setError('Complaint details must be at least 10 characters.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post<{ item: Complaint }>('/complaints', {
        ...form,
        patient_name: patientName,
        subject,
        message,
      });
      setCreatedComplaint(response.item);
      setSuccess('Complaint submitted. The hospital team can review it from the admin panel.');
      setTrackId(response.item.id);
      setTrackedComplaint(response.item);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!trackId.trim()) {
      setTrackError('Enter complaint ID to track issue status.');
      return;
    }

    setTrackLoading(true);
    setTrackError('');

    try {
      const suffix = `?id=${encodeURIComponent(trackId.trim())}${trackPhone.trim() ? `&phone=${encodeURIComponent(trackPhone.trim())}` : ''}`;
      const response = await api.get<{ item: Complaint }>(`/complaints/track${suffix}`);
      setTrackedComplaint(response.item);
    } catch (lookupError) {
      setTrackedComplaint(null);
      setTrackError(lookupError instanceof Error ? lookupError.message : 'Unable to track complaint');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleTrackIdChange = (value: string) => {
    setTrackId(value);
    setTrackError('');
    setTrackedComplaint(null);
  };

  const handleTrackPhoneChange = (value: string) => {
    setTrackPhone(value);
    setTrackError('');
    setTrackedComplaint(null);
  };

  return (
    <section className="panel accent-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Complaint Desk</p>
          <h2>Submit a service complaint or issue for hospital follow-up</h2>
        </div>
        <MessageSquareWarning size={28} />
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <article className="admin-form-grid" style={{ display: 'grid', gap: '0.9rem' }}>
          <div className="card-head">
            <div>
              <p className="eyebrow">New Complaint</p>
              <strong>File an issue for review</strong>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Keep the note short, clear, and tied to the correct department.
              </p>
            </div>
            <Send size={18} />
          </div>

          <div
            className="complaint-form-grid"
            style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            <label className="form-field">
              <span>Patient Name</span>
              <input
                value={form.patient_name}
                onChange={(event) => setForm((current) => ({ ...current, patient_name: event.target.value }))}
                placeholder="Enter patient or attendant name"
                required
              />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Optional contact number"
              />
            </label>
            <label className="form-field">
              <span>Department</span>
              <select
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field form-field-wide">
              <span>Subject</span>
              <input
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Short title for the issue"
                required
              />
            </label>
            <label className="form-field form-field-wide">
              <span>Complaint Details</span>
              <textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Describe the problem clearly so the hospital team can review it."
                rows={7}
                required
              />
            </label>
          </div>

          <div className="action-row">
            <button type="button" onClick={() => void handleSubmit()} disabled={loading}>
              <Send size={16} />
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {success ? <p className="success-text">{success}</p> : null}
            {error ? <p className="error-text">{error}</p> : null}
          </div>

          {createdComplaint ? (
            <article className="complaint-card">
              <div className="card-head">
                <div>
                  <strong>{createdComplaint.subject}</strong>
                  <p>{createdComplaint.department}</p>
                </div>
                <span className={`badge complaint-badge complaint-${createdComplaint.status}`}>{complaintStatusLabel(createdComplaint.status)}</span>
              </div>
              <p>{createdComplaint.message}</p>
              <div className="complaint-meta-grid">
                <small>Complaint ID: {createdComplaint.id}</small>
                <small>Created: {new Date(createdComplaint.updated_at).toLocaleString()}</small>
              </div>
            </article>
          ) : (
            <div className="empty-state">
              <strong>No complaint submitted yet.</strong>
              <p>Fill the form to create a trackable reference for the hospital team.</p>
            </div>
          )}
        </article>

        <article className="admin-form-grid track-issue-panel" style={{ display: 'grid', gap: '0.9rem' }}>
          <div className="card-head">
            <div>
              <p className="eyebrow">Issue Tracking</p>
              <strong>Check whether the complaint is open, in review, or resolved</strong>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Paste the complaint ID to see the latest hospital status.
              </p>
            </div>
          </div>

          <div
            className="complaint-form-grid"
            style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            <label className="form-field">
              <span>Complaint ID</span>
              <input value={trackId} onChange={(event) => handleTrackIdChange(event.target.value)} placeholder="Paste complaint ID" />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input value={trackPhone} onChange={(event) => handleTrackPhoneChange(event.target.value)} placeholder="Optional phone number" />
            </label>
          </div>

          <div className="action-row">
            <button type="button" onClick={() => void handleTrack()} disabled={trackLoading}>
              {trackLoading ? 'Checking...' : 'Track Issue'}
            </button>
          </div>

          {trackError ? <p className="error-text">{trackError}</p> : null}

          {trackedComplaint ? (
            <article className="token-card" style={{ margin: 0 }}>
              <span className="token-label">Tracked complaint</span>
              <strong>{trackedComplaint.subject}</strong>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{trackedComplaint.department}</p>
              <div className="action-row" style={{ marginTop: '0.2rem' }}>
                <span className={`badge complaint-badge complaint-${trackedComplaint.status}`}>{complaintStatusLabel(trackedComplaint.status)}</span>
                <span className="badge">Updated {new Date(trackedComplaint.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="complaint-meta-grid" style={{ marginTop: '0.4rem' }}>
                <small>Complaint ID: {trackedComplaint.id}</small>
                {trackedComplaint.admin_note ? <small>Hospital note: {trackedComplaint.admin_note}</small> : null}
              </div>
            </article>
          ) : (
            <div className="empty-state">
              <strong>Nothing tracked yet.</strong>
              <p>Enter your complaint ID to see the live status and any hospital note.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
};
