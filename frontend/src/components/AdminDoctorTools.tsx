import { useEffect, useState } from 'react';
import { useRealtimeTable } from '../hooks/useRealtimeTable';
import { api } from '../lib/api';
import type { Doctor } from '../types';

export const AdminDoctorTools = ({ token }: { token: string }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const loadDoctors = async () => {
    const data = await api.get<{ items: Doctor[] }>('/doctors');
    setDoctors(data.items);
  };

  useEffect(() => {
    void loadDoctors();
  }, []);

  useRealtimeTable('doctors', () => {
    void loadDoctors();
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Doctor Control</p>
          <h2>Update doctor status, room, and next slot</h2>
        </div>
      </div>

      <div className="stack-list">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="info-card">
            <div className="card-head">
              <div>
                <strong>{doctor.name}</strong>
                <p>{doctor.department}</p>
              </div>
              <select
                defaultValue={doctor.status}
                onChange={(event) => {
                  void api
                    .patch(`/doctors/${doctor.id}`, {
                      status: event.target.value,
                      room: doctor.room,
                      next_slot: doctor.next_slot,
                    }, token)
                    .then(() => loadDoctors());
                }}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off duty</option>
              </select>
            </div>
            <div className="grid-form">
              <input
                defaultValue={doctor.room}
                onBlur={(event) => {
                  void api.patch(`/doctors/${doctor.id}`, {
                    status: doctor.status,
                    room: event.target.value,
                    next_slot: doctor.next_slot,
                  }, token).then(() => loadDoctors());
                }}
              />
              <input
                defaultValue={doctor.next_slot}
                onBlur={(event) => {
                  void api.patch(`/doctors/${doctor.id}`, {
                    status: doctor.status,
                    room: doctor.room,
                    next_slot: event.target.value,
                  }, token).then(() => loadDoctors());
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
