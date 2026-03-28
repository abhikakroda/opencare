import { Search, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import type { Machine } from '../types';

const getMachineTone = (status: Machine['status']) => {
  if (status === 'available') return 'status-available';
  if (status === 'in_use') return 'status-busy';
  return 'status-off';
};

export const MachinePanel = () => {
  const [search, setSearch] = useState('');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMachines = async () => {
    try {
      const data = await api.get<{ items: Machine[] }>(`/machines?search=${encodeURIComponent(search)}`);
      setMachines(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load machines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMachines();
  }, [search]);

  useRealtimeTable('machines', () => {
    void loadMachines();
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Machine Availability</p>
          <h2>See whether hospital machines and equipment are available</h2>
        </div>
      </div>

      <label className="search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search MRI, ventilator, dialysis, CT scanner"
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading machine inventory...</p> : null}
      {!loading && machines.length === 0 ? (
        <div className="empty-state">
          <strong>No machines matched your search.</strong>
          <p>Try equipment name, category, or location.</p>
        </div>
      ) : null}

      <div className="feature-grid">
        {machines.map((machine) => (
          <article key={machine.id} className="info-card">
            <div className="card-head">
              <div>
                <strong>{machine.name}</strong>
                <p>{machine.category}</p>
              </div>
              <span className={`status-pill ${getMachineTone(machine.status)}`}>
                <Settings2 size={14} />
                {machine.status.replace('_', ' ')}
              </span>
            </div>
            <p>Location: {machine.location}</p>
            <p>Quantity: {machine.quantity}</p>
            <p>{machine.notes}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
