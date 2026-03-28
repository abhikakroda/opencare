import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BedDouble, Pill, Ticket } from 'lucide-react';
import { api } from '../../lib/api';
import { detectAnomalies } from '../../lib/monitor';
import type { Bed, Medicine, QueueItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

type QueueApi = {
  items: QueueItem[];
  summary: { waiting: number; called: number; done: number; estimatedWaitMinutes: number };
};

export default function NodalDashboardPage() {
  const { apiToken, readOnly } = useAuth();
  const [queue, setQueue] = useState<QueueApi | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!apiToken) {
      return;
    }

    const load = async () => {
      try {
        const [queueData, medData, bedData] = await Promise.all([
          api.get<QueueApi>('/queue', apiToken),
          api.get<{ items: Medicine[] }>('/medicines', apiToken),
          api.get<{ items: Bed[] }>('/beds', apiToken),
        ]);
        setQueue(queueData);
        setMedicines(medData.items);
        setBeds(bedData.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load monitoring data');
      }
    };

    void load();
  }, [apiToken]);

  const metrics = useMemo(() => {
    const totalPatients = queue?.items.length ?? 0;
    const waitingPatients = queue?.summary.waiting ?? 0;
    const occupied = beds.filter((b) => b.status === 'occupied').length;
    const totalBeds = beds.length || 1;
    const occupancyPct = (occupied / totalBeds) * 100;
    const lowStock = medicines.filter((m) => m.stock_qty < 20).length;
    const alerts = detectAnomalies({
      waitingPatients,
      bedOccupancyPct: occupancyPct,
      lowStockMedicines: lowStock,
    });
    return { totalPatients, waitingPatients, occupied, totalBeds, occupancyPct, lowStock, alerts };
  }, [queue, beds, medicines]);

  return (
    <main className="page-shell">
      <section className="hero compact-hero">
        <div className="hero-copy">
          <p className="eyebrow">Nodal monitoring</p>
          <h1>Hospital-wide situational view</h1>
          <p className="hero-text">
            Read-only telemetry across queues, pharmacy stock, and bed occupancy. No actions are available on this screen.
          </p>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="feature-grid">
        <article className="panel">
          <p className="eyebrow">Total patients in queue</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ticket size={22} />
            {metrics.totalPatients}
          </h2>
          <p className="hero-text">Waiting now: {metrics.waitingPatients}</p>
        </article>

        <article className="panel">
          <p className="eyebrow">Bed occupancy</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BedDouble size={22} />
            {metrics.occupancyPct.toFixed(1)}%
          </h2>
          <p className="hero-text">
            {metrics.occupied} occupied of {metrics.totalBeds} beds
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Low-stock medicines</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pill size={22} />
            {metrics.lowStock}
          </h2>
          <p className="hero-text">Threshold: stock under 20 units</p>
        </article>

        <article className="panel">
          <p className="eyebrow">Complaint / pressure trend</p>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} />
            {metrics.waitingPatients} waiting
          </h2>
          <p className="hero-text">Proxy metric based on live queue depth</p>
        </article>
      </section>

      {metrics.alerts.length ? (
        <section className="panel" style={{ marginTop: '1.5rem' }}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Automated alerts</p>
              <h2>Anomaly detection</h2>
            </div>
            <AlertTriangle size={24} />
          </div>
          <ul className="stack-list">
            {metrics.alerts.map((alert) => (
              <li key={alert.title} className={`queue-item ${alert.level === 'critical' ? 'bed-occupied' : ''}`}>
                <strong>{alert.title}</strong>
                <p>{alert.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {readOnly ? (
        <p className="hero-text" style={{ marginTop: '1rem' }}>
          Interactive controls stay disabled for nodal accounts to protect operational data.
        </p>
      ) : null}
    </main>
  );
}
