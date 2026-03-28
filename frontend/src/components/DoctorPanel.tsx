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
  const availableCount = doctors.filter((doctor) => doctor.status === 'available').length;
  const busyCount = doctors.filter((doctor) => doctor.status === 'busy').length;
  const offDutyCount = doctors.filter((doctor) => doctor.status === 'off_duty').length;

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
          <p className="eyebrow">Doctor Directory</p>
          <h2>Find available doctors and their next slot</h2>
          <p className="hero-text">
            Search by name, department, or specialization to see live availability across the hospital.
          </p>
        </div>
        <div className="stat-row">
          <div className="mini-stat"><span>{availableCount} available</span></div>
          <div className="mini-stat"><span>{busyCount} busy</span></div>
          <div className="mini-stat"><span>{offDutyCount} off duty</span></div>
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
            <div style={{ display: 'grid', gap: '0.45rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                <span className="badge badge-called">Department: {doctor.department}</span>
                <span className="badge badge-stock-ok">Room: {doctor.room}</span>
              </div>
              <p style={{ margin: 0 }}>Next slot: {doctor.next_slot}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
