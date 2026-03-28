import { useEffect, useState } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Medicine } from '../types';

export const AdminPharmacyTools = ({ token, readOnly = false }: { token: string; readOnly?: boolean }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const loadMedicines = async () => {
    const data = await api.get<{ items: Medicine[] }>('/medicines');
    setMedicines(data.items);
  };

  useEffect(() => {
    void loadMedicines();
  }, []);

  useRealtimeTable('medicines', () => {
    void loadMedicines();
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Pharmacy Stock</p>
          <h2>Update medicine quantities on a dedicated stock page</h2>
        </div>
      </div>

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
                  void api
                    .patch(`/medicines/${medicine.id}`, { stock_qty: Number(event.target.value), location: medicine.location }, token)
                    .then(() => loadMedicines());
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
