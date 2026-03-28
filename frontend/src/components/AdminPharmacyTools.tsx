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
  const [form, setForm] = useState({
    name: '',
    generic_name: '',
    brand_names: '',
    stock_qty: '0',
    location: '',
    alternatives: '',
  });

  const loadMedicines = async () => {
    try {
      const data = await api.get<{ items: Medicine[] }>('/medicines');
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
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Pharmacy Stock</p>
          <h2>Update medicine quantities on a dedicated stock page</h2>
        </div>
      </div>

      <form className="admin-create-form" onSubmit={(event) => void handleSubmit(event)}>
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Medicine name" required disabled={readOnly} />
        <input value={form.generic_name} onChange={(event) => setForm((current) => ({ ...current, generic_name: event.target.value }))} placeholder="Generic name" required disabled={readOnly} />
        <input value={form.brand_names} onChange={(event) => setForm((current) => ({ ...current, brand_names: event.target.value }))} placeholder="Brand names comma separated" disabled={readOnly} />
        <input type="number" min="0" value={form.stock_qty} onChange={(event) => setForm((current) => ({ ...current, stock_qty: event.target.value }))} placeholder="Stock qty" required disabled={readOnly} />
        <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" required disabled={readOnly} />
        <input value={form.alternatives} onChange={(event) => setForm((current) => ({ ...current, alternatives: event.target.value }))} placeholder="Alternatives comma separated" disabled={readOnly} />
        <button type="submit" disabled={readOnly}>Add Medicine</button>
      </form>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading medicines...</p> : null}

      <div className="stack-list">
        {medicines.map((medicine) => (
          <article key={medicine.id} className="medicine-card">
            <div className="card-head">
              <div>
                <strong>{medicine.name}</strong>
                <p>{medicine.location}</p>
              </div>
              <input
                type="number"
                min="0"
                defaultValue={medicine.stock_qty}
                disabled={readOnly}
                onBlur={(event) => {
                  if (readOnly) {
                    return;
                  }
                  void (async () => {
                    try {
                      setError('');
                      setMessage('');
                      await api.patch(`/medicines/${medicine.id}`, { stock_qty: Number(event.target.value), location: medicine.location }, token);
                      setMessage(`${medicine.name} updated`);
                      await loadMedicines();
                    } catch (updateError) {
                      setError(updateError instanceof Error ? updateError.message : 'Unable to update medicine');
                    }
                  })();
                }}
              />
            </div>
            <p>{medicine.generic_name}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
