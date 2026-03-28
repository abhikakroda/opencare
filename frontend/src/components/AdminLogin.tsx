import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export type AdminAccessRole = 'admin' | 'staff' | 'nodal_officer';

export type AdminSession = {
  token: string;
  profile: {
    email: string;
    role: AdminAccessRole;
    sub_role: string | null;
  };
};

type AdminLoginProps = {
  role: AdminAccessRole;
  onLogin: (session: AdminSession) => void;
  notice?: string;
};

const DEMO_CREDENTIALS: Record<AdminAccessRole, { email: string; password: string; label: string }> = {
  admin: { email: 'admin@opencare.com', password: '123456', label: 'Hospital Admin' },
  staff: { email: 'staff@opencare.com', password: '123456', label: 'Staff' },
  nodal_officer: { email: 'nodal@opencare.com', password: '123456', label: 'Nodal Officer' },
};

export const AdminLogin = ({ role, onLogin, notice }: AdminLoginProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_CREDENTIALS[role].email);
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const preset = DEMO_CREDENTIALS[role];

  useEffect(() => {
    setEmail(preset.email);
    setPassword(preset.password);
    setError('');
  }, [preset.email, preset.password]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post<AdminSession>('/auth/login', { email, password, access_role: role });
      onLogin(response);
      navigate('/admin');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    }
  };

  return (
    <section className="panel admin-login">
      <p className="eyebrow">Admin Access</p>
      <h2>{preset.label} login</h2>
      <p className="hero-text">Demo login: `{preset.email}` / `{preset.password}`</p>
      {notice ? <p className="error-text">{notice}</p> : null}
      <form className="grid-form" onSubmit={handleLogin}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
        <button type="submit">Open {preset.label} Access</button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
};
