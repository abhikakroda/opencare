import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import type { Medicine } from '../types';
import { StatusBadge } from './StatusBadge';

const getStockTone = (quantity: number): 'stock-ok' | 'stock-low' | 'stock-out' => {
  if (quantity <= 0) return 'stock-out';
  if (quantity <= 15) return 'stock-low';
  return 'stock-ok';
};

export const MedicinePanel = () => {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const loadMedicines = async () => {
    const data = await api.get<{ items: Medicine[] }>(`/medicines?search=${encodeURIComponent(search)}`);
    setMedicines(data.items);
  };

  useEffect(() => {
    void loadMedicines();
  }, [search]);

  useRealtimeTable('medicines', () => {
    void loadMedicines();
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Medicine Availability</p>
          <h2>Search generic or brand medicines in the hospital store</h2>
        </div>
      </div>

      <label className="search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search paracetamol, dolo, azithromycin..."
        />
      </label>

      <div className="medicine-grid">
        {medicines.map((medicine) => (
          <article key={medicine.id} className="medicine-card">
            <div className="card-head">
              <div>
                <strong>{medicine.name}</strong>
                <p>{medicine.generic_name}</p>
              </div>
              <StatusBadge tone={getStockTone(medicine.stock_qty)} />
            </div>
            <p>Qty: {medicine.stock_qty}</p>
            <p>Location: {medicine.location}</p>
            <p>Brands: {medicine.brand_names.join(', ') || 'N/A'}</p>
            {medicine.stock_qty <= 0 && medicine.alternatives.length > 0 ? (
              <p>Alternatives: {medicine.alternatives.join(', ')}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};
