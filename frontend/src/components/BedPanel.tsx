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

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Bed & Ward Management</p>
          <h2>Live bed occupancy across all wards</h2>
        </div>
        <div className="stat-row">
          <div className="mini-stat"><BedDouble size={18} /><span>{bedData.summary.available} available</span></div>
          <div className="mini-stat"><BedDouble size={18} /><span>{bedData.summary.occupied} occupied</span></div>
          <div className="mini-stat"><BedDouble size={18} /><span>{bedData.summary.cleaning} cleaning</span></div>
        </div>
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
          <h3>{ward}</h3>
          <div className="bed-grid">
            {beds.map((bed) => (
              <article key={bed.id} className={`bed-card bed-${bed.status}`}>
                <strong>{bed.bed_number}</strong>
                <span>{bed.status}</span>
                <small>{bed.patient_name ?? 'Vacant'}</small>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};
