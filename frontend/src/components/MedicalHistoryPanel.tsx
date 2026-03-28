import { FileClock, ShieldCheck, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import type { MedicalHistory } from '../types';

type VerifyResponse = {
  verified: boolean;
  demoOtp: string;
  items: MedicalHistory[];
};

export const MedicalHistoryPanel = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<MedicalHistory[]>([]);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post<VerifyResponse>('/medical-history/verify', { phone, otp });
      setItems(response.items);
      setVerified(response.verified);
    } catch (verifyError) {
      setVerified(false);
      setItems([]);
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify mobile access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel accent-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Past History</p>
          <h2>Check medical history with mobile verification</h2>
        </div>
        <FileClock size={28} />
      </div>

      <div className="history-auth-card" style={{ gap: '1rem' }}>
        <div className="card-head">
          <div>
            <strong>Mobile auth showcase</strong>
            <p>Use your mobile number and demo OTP to open past history records.</p>
          </div>
          <Smartphone size={18} />
        </div>

        <div
          className="grid-form"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            alignItems: 'end',
          }}
        >
          <label className="form-field">
            <span>Mobile number</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter mobile number" />
          </label>
          <label className="form-field">
            <span>OTP</span>
            <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter OTP" maxLength={4} />
          </label>
          <button type="button" onClick={() => void handleVerify()} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & View'}
          </button>
        </div>

        <div className="action-row" style={{ marginTop: '0.1rem' }}>
          <span className="badge">Demo OTP 1234</span>
          <span className="badge">Mobile verified only</span>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {verified ? (
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <div className="token-card" style={{ margin: 0 }}>
            <span className="token-label">Access granted</span>
            <strong>Medical history unlocked</strong>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Showing {items.length} record{items.length === 1 ? '' : 's'} for {phone || 'this mobile number'}.
            </p>
            <div className="action-row" style={{ marginTop: '0.25rem' }}>
              <span className="badge">
                <ShieldCheck size={14} />
                Mobile verified
              </span>
              <span className="badge">Demo OTP 1234</span>
            </div>
          </div>

          {items.length ? (
            <div className="history-result-grid">
              {items.map((item) => (
                <article key={item.id} className="history-card">
                  <div className="card-head">
                    <div>
                      <strong>{item.patient_name}</strong>
                      <p>{item.department}</p>
                    </div>
                    <span className="badge complaint-resolved">{new Date(item.visit_date).toLocaleDateString()}</span>
                  </div>
                  <p><strong>Diagnosis:</strong> {item.diagnosis}</p>
                  <p><strong>Medicines:</strong> {item.medicines.join(', ') || 'Not recorded'}</p>
                  <p><strong>Allergies:</strong> {item.allergies.join(', ') || 'None noted'}</p>
                  <p><strong>Notes:</strong> {item.notes || 'No extra notes'}</p>
                  <small>Recorded by {item.recorded_by}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No past history found.</strong>
              <p>This mobile number has no saved records yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Mobile verification required.</strong>
          <p>Enter the patient mobile number and demo OTP to view medical history.</p>
        </div>
      )}
    </section>
  );
};
