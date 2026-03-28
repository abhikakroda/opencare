import { MessageSquareWarning } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Complaint, ComplaintStatus } from '../types';

const statusOptions: ComplaintStatus[] = ['open', 'in_review', 'resolved'];

export const AdminComplaintTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const openCount = complaints.filter((complaint) => complaint.status === 'open').length;
  const reviewCount = complaints.filter((complaint) => complaint.status === 'in_review').length;
  const resolvedCount = complaints.filter((complaint) => complaint.status === 'resolved').length;

  const loadComplaints = async () => {
    try {
      const suffix = statusFilter === 'all' ? '' : `?status=${encodeURIComponent(statusFilter)}`;
      const data = await api.get<{ items: Complaint[] }>(`/complaints${suffix}`, token);
      setComplaints(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, [statusFilter]);

  useRealtimeTable('complaints', () => {
    void loadComplaints();
  });

  const handleStatusUpdate = async (complaint: Complaint, status: ComplaintStatus) => {
    setError('');
    setMessage('');

    try {
      await api.patch(`/complaints/${complaint.id}`, { status, admin_note: complaint.admin_note ?? '' }, token);
      setMessage(`${complaint.subject} marked ${status.replace('_', ' ')}`);
      await loadComplaints();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update complaint');
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Complaints Desk</p>
          <h2>Review submitted complaints and move them through the response workflow</h2>
          <p className="helper-text">Filter complaints, review the latest message, and move each issue from open to resolved.</p>
        </div>
        <MessageSquareWarning size={28} />
      </div>

      <div className="token-card" style={{ marginBottom: '1rem' }}>
        <span className="token-label">Live complaint snapshot</span>
        <strong>{complaints.length} complaints in the queue</strong>
        <div className="action-row" style={{ marginTop: '0.25rem' }}>
          <span className="badge complaint-open">Open {openCount}</span>
          <span className="badge complaint-in_review">In review {reviewCount}</span>
          <span className="badge complaint-resolved">Resolved {resolvedCount}</span>
        </div>
      </div>

      <div className="admin-form-grid" style={{ marginBottom: '1rem' }}>
        <label className="form-field">
          <span>Status filter</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ComplaintStatus)}>
            <option value="all">All complaints</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.75rem' }}>
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <p className="helper-text">Loading complaints...</p> : null}
      </div>

      {!loading && complaints.length === 0 ? (
        <div className="empty-state">
          <strong>No complaints found.</strong>
          <p>New patient complaints will appear here automatically.</p>
        </div>
      ) : null}

      <div className="stack-list">
        {complaints.map((complaint) => (
          <article key={complaint.id} className="complaint-card">
            <div className="card-head">
              <div>
                <strong>{complaint.subject}</strong>
                <p>{complaint.patient_name} · {complaint.department}</p>
              </div>
              <span className={`badge complaint-badge complaint-${complaint.status}`}>{complaint.status.replace('_', ' ')}</span>
            </div>
            <p>{complaint.message}</p>
            <div className="complaint-meta-grid">
              <small>Phone: {complaint.phone || 'Not provided'}</small>
              <small>Created: {new Date(complaint.created_at).toLocaleString()}</small>
            </div>
            <div className="action-row" style={{ marginTop: '0.25rem' }}>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="secondary-button"
                  disabled={readOnly || complaint.status === status}
                  onClick={() => {
                    void handleStatusUpdate(complaint, status);
                  }}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
