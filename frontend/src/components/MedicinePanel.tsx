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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ items: Medicine[] }>(`/medicines?search=${encodeURIComponent(search)}`);
      setMedicines(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMedicines();
  }, [search]);

  useRealtimeTable('medicines', () => {
    void loadMedicines();
  });

  const stockCounts = {
    total: medicines.length,
    inStock: medicines.filter((medicine) => medicine.stock_qty > 0).length,
    low: medicines.filter((medicine) => medicine.stock_qty > 0 && medicine.stock_qty <= 15).length,
    out: medicines.filter((medicine) => medicine.stock_qty <= 0).length,
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Medicine Hub</p>
          <h2>Search stock and alternatives across the pharmacy</h2>
          <p className="hero-text">Look up medicine names, brand names, stock status, and available alternatives.</p>
        </div>
        <div className="stat-row">
          <div className="mini-stat">
            <span>Total: {stockCounts.total}</span>
          </div>
          <div className="mini-stat">
            <span>In stock: {stockCounts.inStock}</span>
          </div>
        </div>
      </div>

      <div className="stat-row" style={{ marginBottom: '1rem' }}>
        <div className="mini-stat">
          <span>Low stock: {stockCounts.low}</span>
        </div>
        <div className="mini-stat">
          <span>Out of stock: {stockCounts.out}</span>
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

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading stock data...</p> : null}
      {!loading && medicines.length === 0 ? (
        <div className="empty-state">
          <strong>No medicine matched your search.</strong>
          <p>Try a generic name, brand name, or clear the filter.</p>
        </div>
      ) : null}

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
