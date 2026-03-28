import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_PROFILE_STORAGE_KEY, ADMIN_TOKEN_STORAGE_KEY, api } from '../lib/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanedEmail = email.trim().toLowerCase();
      const cleanedPassword = password.trim();

      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);

      const response = await api.post<AdminSession>('/auth/login', { email: cleanedEmail, password: cleanedPassword });
      onLogin(response);
      navigate('/admin');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setLoading(false);
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

      <div className="admin-login-meta">
        <span className="badge">Admin</span>
        <span className="badge">Staff</span>
        <span className="badge">Nodal Officer</span>
      </div>

      <div className="admin-callout admin-callout-info">
        <strong>Demo access</strong>
        <p>
          <code>admin@opencare.com</code> / <code>123456</code>
        </p>
      </div>

      {notice ? (
        <div className="admin-callout admin-callout-info">
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
          <button type="submit" disabled={loading}>{loading ? 'Opening workspace...' : 'Open admin workspace'}</button>
          <span className="helper-text">Protected access for hospital operations.</span>
        </div>
      </form>

      {error ? (
        <div className="admin-callout admin-callout-error">
          <strong>Login failed</strong>
          <p>{error}</p>
        </div>
      ) : null}
    </section>
  );
};
