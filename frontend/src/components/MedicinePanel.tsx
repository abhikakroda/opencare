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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadMedicines = async () => {
    try {
      setRefreshing(true);
      const query = debouncedSearch.trim();
      const data = await api.get<{ items: Medicine[] }>(`/medicines?search=${encodeURIComponent(query)}`);
      setMedicines(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load medicines');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void loadMedicines();
  }, [debouncedSearch]);

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
        <div className="mini-stat">
          <span>Live refresh: {refreshing ? 'Updating' : 'Idle'}</span>
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
      {loading ? (
        <div className="empty-state">
          <strong>Loading stock data</strong>
          <p>Refreshing pharmacy records for the latest search.</p>
        </div>
      ) : null}
      {!loading && medicines.length === 0 ? (
        <div className="empty-state">
          <strong>No medicine matched your search.</strong>
          <p>{debouncedSearch.trim() ? 'Try a generic name, brand name, or clear the search box.' : 'Add a medicine to begin browsing the live stock list.'}</p>
        </div>
      ) : null}

      <div className="medicine-grid">
        {medicines.map((medicine) => (
          <article key={medicine.id} className="medicine-card" style={{ gap: '0.8rem' }}>
            <div className="card-head">
              <div>
                <strong>{medicine.name}</strong>
                <p>{medicine.generic_name}</p>
              </div>
              <StatusBadge tone={getStockTone(medicine.stock_qty)} />
            </div>
            <div className="action-row" style={{ marginTop: '-0.1rem' }}>
              <span className="badge">Brands: {medicine.brand_names.length || 0}</span>
              <span className="badge">Alternatives: {medicine.alternatives.length || 0}</span>
            </div>
            <p className="helper-text" style={{ marginTop: '-0.15rem' }}>
              {medicine.brand_names.length ? medicine.brand_names.join(', ') : 'No brand names recorded.'}
            </p>
            {medicine.stock_qty <= 0 && medicine.alternatives.length > 0 ? (
              <p className="helper-text" style={{ marginTop: '-0.2rem' }}>
                Alternatives: {medicine.alternatives.join(', ')}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};
