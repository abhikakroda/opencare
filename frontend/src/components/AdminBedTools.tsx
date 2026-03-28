import { useEffect, useMemo, useState } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Bed } from '../types';

export const AdminBedTools = ({ token }: { token: string }) => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patientName, setPatientName] = useState('');

  const loadBeds = async () => {
    const data = await api.get<{ items: Bed[] }>('/beds');
    setBeds(data.items);
  };

  useEffect(() => {
    void loadBeds();
  }, []);

  useRealtimeTable('beds', () => {
    void loadBeds();
  });

  const wards = useMemo(() => Array.from(new Set(beds.map((bed) => bed.ward))), [beds]);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Bed Actions</p>
          <h2>Handle admissions and turnover on a clean ward management page</h2>
        </div>
      </div>

      <input
        value={patientName}
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
                    onClick={() => {
                      void api.patch(`/beds/${bed.id}`, { action: 'admit', patient_name: patientName || 'Admitted Patient' }, token).then(() => loadBeds());
                    }}
                  >
                    Admit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void api.patch(`/beds/${bed.id}`, { action: 'discharge' }, token).then(() => loadBeds());
                    }}
                  >
                    Discharge
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void api.patch(`/beds/${bed.id}`, { action: 'cleaning' }, token).then(() => loadBeds());
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
