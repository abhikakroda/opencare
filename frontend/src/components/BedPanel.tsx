import { BedDouble } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import type { Bed } from '../types';

type BedResponse = {
  items: Bed[];
  summary: {
    available: number;
    occupied: number;
    cleaning: number;
  };
};

export const BedPanel = () => {
  const [bedData, setBedData] = useState<BedResponse>({
    items: [],
    summary: { available: 0, occupied: 0, cleaning: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBeds = async () => {
    try {
      const data = await api.get<BedResponse>('/beds');
      setBedData(data);
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

  const grouped = bedData.items.reduce<Record<string, Bed[]>>((acc, bed) => {
    acc[bed.ward] = acc[bed.ward] ?? [];
    acc[bed.ward].push(bed);
    return acc;
  }, {});
  const totalBeds = bedData.items.length;
  const occupancyRate = totalBeds ? Math.round((bedData.summary.occupied / totalBeds) * 100) : 0;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Bed & Ward Status</p>
          <h2>Live ward occupancy across the hospital</h2>
          <p className="hero-text">
            Check available, occupied, and cleaning beds grouped by ward for faster admission planning.
          </p>
        </div>
        <div className="stat-row">
          <div className="mini-stat"><BedDouble size={18} /><span>{bedData.summary.available} available</span></div>
          <div className="mini-stat"><BedDouble size={18} /><span>{bedData.summary.occupied} occupied</span></div>
          <div className="mini-stat"><BedDouble size={18} /><span>{bedData.summary.cleaning} cleaning</span></div>
        </div>
      </div>

      <div className="feature-grid" style={{ marginBottom: '1rem' }}>
        <article className="info-card">
          <strong>Total beds</strong>
          <p>{totalBeds}</p>
        </article>
        <article className="info-card">
          <strong>Occupancy rate</strong>
          <p>{occupancyRate}%</p>
        </article>
        <article className="info-card">
          <strong>Free capacity</strong>
          <p>{bedData.summary.available}</p>
        </article>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading ward occupancy...</p> : null}
      {!loading && bedData.items.length === 0 ? (
        <div className="empty-state">
          <strong>No bed data available.</strong>
          <p>Bed and ward records will appear here as soon as they are added.</p>
        </div>
      ) : null}

      {Object.entries(grouped).map(([ward, beds]) => (
        <div key={ward} className="ward-section">
          <div className="card-head">
            <div>
              <strong>{ward}</strong>
              <p>{beds.length} beds</p>
            </div>
            <span className="badge badge-called">{beds.filter((bed) => bed.status === 'available').length} open</span>
          </div>
          <div className="bed-grid">
            {beds.map((bed) => (
              <article key={bed.id} className={`bed-card bed-${bed.status}`}>
                <strong>{bed.bed_number}</strong>
                <span>{bed.status.replace('_', ' ')}</span>
                <small>{bed.patient_name ?? 'Vacant'}</small>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};
