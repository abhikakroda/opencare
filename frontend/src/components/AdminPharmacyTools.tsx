import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Medicine } from '../types';

export const AdminPharmacyTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    generic_name: '',
    brand_names: '',
    stock_qty: '0',
    location: '',
    alternatives: '',
  });

  const stockedCount = medicines.filter((medicine) => medicine.stock_qty > 20).length;
  const lowStockCount = medicines.filter((medicine) => medicine.stock_qty > 0 && medicine.stock_qty <= 20).length;
  const outOfStockCount = medicines.filter((medicine) => medicine.stock_qty === 0).length;
  const totalBrands = medicines.reduce((count, medicine) => count + medicine.brand_names.length, 0);

  const getStockTone = (stockQty: number) => {
    if (stockQty === 0) return 'stock-out';
    if (stockQty <= 20) return 'stock-low';
    return 'stock-ok';
  };

  const getStockLabel = (stockQty: number) => {
    if (stockQty === 0) return 'Out of stock';
    if (stockQty <= 20) return 'Low stock';
    return 'Stock healthy';
  };

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Medicine[] }>('/medicines');
      setMedicines(data.items);
      setDrafts((current) => {
        const next = { ...current };
        data.items.forEach((medicine) => {
          if (next[medicine.id] === undefined) {
            next[medicine.id] = String(medicine.stock_qty);
          }
        });
        return next;
      });
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMedicines();
  }, []);

  useRealtimeTable('medicines', () => {
    void loadMedicines();
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post(
        '/medicines',
        {
          name: form.name,
          generic_name: form.generic_name,
          brand_names: form.brand_names.split(',').map((item) => item.trim()).filter(Boolean),
          stock_qty: Number(form.stock_qty),
          location: form.location,
          alternatives: form.alternatives.split(',').map((item) => item.trim()).filter(Boolean),
        },
        token,
      );

      setForm({
        name: '',
        generic_name: '',
        brand_names: '',
        stock_qty: '0',
        location: '',
        alternatives: '',
      });
      setMessage('Medicine added');
      await loadMedicines();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to add medicine');
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Pharmacy Stock</p>
          <h2>Keep pharmacy stock clean, current, and easy to update</h2>
          <p className="helper-text">Add a new medicine in the form below, then update stock from each medicine card with a single save action.</p>
          <div className="action-row" style={{ marginTop: '0.6rem' }}>
            <span className="badge">Medicines {medicines.length}</span>
            <span className="badge badge-stock-ok">Healthy {stockedCount}</span>
            <span className="badge badge-stock-low">Low {lowStockCount}</span>
            <span className="badge badge-stock-out">Out {outOfStockCount}</span>
          </div>
        </div>
        <div className="feature-grid" style={{ width: 'min(100%, 460px)', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          <article className="mini-stat">
            <strong>{medicines.length}</strong>
            <span>Total medicines</span>
          </article>
          <article className="mini-stat">
            <strong>{stockedCount}</strong>
            <span>Healthy stock</span>
          </article>
          <article className="mini-stat">
            <strong>{lowStockCount + outOfStockCount}</strong>
            <span>Needs attention</span>
          </article>
          <article className="mini-stat">
            <strong>{totalBrands}</strong>
            <span>Brand entries</span>
          </article>
        </div>
      </div>

      <div className="info-card" style={{ gap: '0.9rem', marginBottom: '1rem' }}>
        <div className="card-head" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Add Medicine</p>
            <strong>Register a new medicine entry</strong>
            <p className="helper-text">Use comma-separated values for brands and alternatives. Stock can be adjusted later from each card below.</p>
          </div>
          <span className="badge badge-stock-ok">Live Supabase</span>
        </div>

        <form className="admin-create-form admin-form-grid" onSubmit={(event) => void handleSubmit(event)}>
          <label className="form-field">
            <span>Medicine name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Paracetamol 650" required disabled={readOnly} />
          </label>
          <label className="form-field">
            <span>Generic name</span>
            <input value={form.generic_name} onChange={(event) => setForm((current) => ({ ...current, generic_name: event.target.value }))} placeholder="Paracetamol" required disabled={readOnly} />
          </label>
          <label className="form-field">
            <span>Brand names</span>
            <input value={form.brand_names} onChange={(event) => setForm((current) => ({ ...current, brand_names: event.target.value }))} placeholder="Dolo 650, Crocin" disabled={readOnly} />
          </label>
          <label className="form-field">
            <span>Stock quantity</span>
            <input type="number" min="0" value={form.stock_qty} onChange={(event) => setForm((current) => ({ ...current, stock_qty: event.target.value }))} placeholder="120" required disabled={readOnly} />
          </label>
          <label className="form-field">
            <span>Location</span>
            <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Pharmacy A / Rack 3" required disabled={readOnly} />
          </label>
          <label className="form-field form-field-wide">
            <span>Alternatives</span>
            <input value={form.alternatives} onChange={(event) => setForm((current) => ({ ...current, alternatives: event.target.value }))} placeholder="Acetaminophen 500" disabled={readOnly} />
          </label>
          <button type="submit" disabled={readOnly}>Add Medicine</button>
        </form>
      </div>

      {message ? (
        <div className="empty-state" style={{ marginBottom: '0.9rem' }}>
          <strong>Medicine saved</strong>
          <p>{message}</p>
        </div>
      ) : null}
      {error ? (
        <div className="empty-state" style={{ marginBottom: '0.9rem' }}>
          <strong>Pharmacy update failed</strong>
          <p>{error}</p>
        </div>
      ) : null}
      {loading ? (
        <div className="empty-state" style={{ marginBottom: '0.9rem' }}>
          <strong>Loading medicines</strong>
          <p>Refreshing the latest pharmacy stock and availability data.</p>
        </div>
      ) : null}

      <div className="stack-list">
        {medicines.map((medicine) => (
          <article key={medicine.id} className="medicine-card" style={{ gap: '0.9rem' }}>
            <div className="card-head">
              <div>
                <strong>{medicine.name}</strong>
                <p>{medicine.generic_name}</p>
              </div>
              <span className={`badge badge-${getStockTone(medicine.stock_qty)}`}>{getStockLabel(medicine.stock_qty)}</span>
            </div>
            <div className="action-row" style={{ marginTop: '-0.1rem' }}>
              <span className="badge badge-called">Location: {medicine.location}</span>
              <span className="badge badge-stock-ok">Brands: {medicine.brand_names.length || 0}</span>
              <span className="badge">Alternatives: {medicine.alternatives.length || 0}</span>
            </div>
            <p className="helper-text" style={{ marginTop: '-0.1rem' }}>
              {medicine.brand_names.length ? medicine.brand_names.join(', ') : 'No brand names recorded.'}
            </p>
            <p className="helper-text" style={{ marginTop: '-0.35rem' }}>
              {medicine.alternatives.length ? `Alternatives: ${medicine.alternatives.join(', ')}` : 'No alternatives recorded.'}
            </p>
            <div style={{ display: 'grid', gap: '0.8rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
              <div className="card-head" style={{ alignItems: 'flex-start' }}>
                <div>
                  <p className="token-label">Quick update</p>
                  <strong>Adjust current stock only</strong>
                </div>
                <span className="badge badge-stock-ok">Editable</span>
              </div>
              <div className="grid-form">
                <label className="form-field">
                  <span>Update stock</span>
                <input
                  type="number"
                  min="0"
                  value={drafts[medicine.id] ?? String(medicine.stock_qty)}
                  disabled={readOnly}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDrafts((current) => ({
                        ...current,
                        [medicine.id]: value,
                      }));
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={readOnly || savingId === medicine.id}
                  onClick={() => {
                    void (async () => {
                      try {
                        setSavingId(medicine.id);
                        setError('');
                        setMessage('');
                        const stock_qty = Number(drafts[medicine.id] ?? medicine.stock_qty);
                        if (!Number.isFinite(stock_qty) || stock_qty < 0) {
                          throw new Error('Enter a valid stock quantity');
                        }
                        await api.patch(`/medicines/${medicine.id}`, { stock_qty, location: medicine.location }, token);
                        setMessage(`${medicine.name} updated`);
                        setDrafts((current) => {
                          const next = { ...current };
                          delete next[medicine.id];
                          return next;
                        });
                        await loadMedicines();
                      } catch (updateError) {
                        setError(updateError instanceof Error ? updateError.message : 'Unable to update medicine');
                      } finally {
                        setSavingId(null);
                      }
                    })();
                  }}
                >
                  {savingId === medicine.id ? 'Saving...' : 'Save stock'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
