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

  const loadMachines = async () => {
    const data = await api.get<{ items: Machine[] }>(`/machines?search=${encodeURIComponent(search)}`);
    setMachines(data.items);
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
