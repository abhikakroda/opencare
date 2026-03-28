import { useState } from 'react';
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
  onLogin: (session: AdminSession) => void;
  notice?: string;
};

export const AdminLogin = ({ onLogin, notice }: AdminLoginProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post<AdminSession>('/auth/login', { email, password });
      onLogin(response);
      navigate('/admin');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    }
  };

  return (
    <section className="panel admin-login">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Admin Access</p>
          <h2>Hospital admin, staff, and nodal officer sign in</h2>
          <p className="helper-text">Use your assigned email and password to open the dedicated admin workspace.</p>
        </div>
      </div>

      {notice ? (
        <div className="empty-state">
          <strong>Session notice</strong>
          <p>{notice}</p>
        </div>
      ) : null}

      <form className="admin-create-form admin-form-grid" onSubmit={handleLogin}>
        <label className="form-field">
          <span>Email address</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@opencare.com" required />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Enter password" required />
        </label>
        <div className="action-row">
          <button type="submit">Open admin workspace</button>
          <span className="helper-text">Protected access for hospital operations.</span>
        </div>
      </form>

      {error ? (
        <div className="empty-state">
          <strong>Login failed</strong>
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
};
