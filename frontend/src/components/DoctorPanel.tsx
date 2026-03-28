import { Search, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import type { Doctor } from '../types';

const getDoctorTone = (status: Doctor['status']) => {
  if (status === 'available') return 'status-available';
  if (status === 'busy') return 'status-busy';
  return 'status-off';
};

export const DoctorPanel = () => {
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDoctors = async () => {
    try {
      const data = await api.get<{ items: Doctor[] }>(`/doctors?search=${encodeURIComponent(search)}`);
      setDoctors(data.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctors();
  }, [search]);

  useRealtimeTable('doctors', () => {
    void loadDoctors();
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Doctor Availability</p>
          <h2>Check which doctors are available right now</h2>
        </div>
      </div>

      <label className="search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search doctor, department, or specialization"
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="helper-text">Loading doctor directory...</p> : null}
      {!loading && doctors.length === 0 ? (
        <div className="empty-state">
          <strong>No doctors matched your search.</strong>
          <p>Search by doctor name, department, or specialization.</p>
        </div>
      ) : null}

      <div className="feature-grid">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="info-card">
            <div className="card-head">
              <div>
                <strong>{doctor.name}</strong>
                <p>{doctor.specialization}</p>
              </div>
              <span className={`status-pill ${getDoctorTone(doctor.status)}`}>
                <Stethoscope size={14} />
                {doctor.status.replace('_', ' ')}
              </span>
            </div>
            <p>Department: {doctor.department}</p>
            <p>Room: {doctor.room}</p>
            <p>Next slot: {doctor.next_slot}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
