import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';

type AdminLoginProps = {
  onLogin: (token: string) => void;
  notice?: string;
};

export const AdminLogin = ({ onLogin, notice }: AdminLoginProps) => {
  const [email, setEmail] = useState('admin@opencare.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post<{ token: string }>('/auth/login', { email, password });
      onLogin(response.token);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    }
  };

  return (
    <section className="panel admin-login">
      <p className="eyebrow">Admin Access</p>
      <h2>Staff login for queue, pharmacy, and bed control pages</h2>
      <p className="hero-text">Demo login: `admin@opencare.com` / `123456`</p>
      {notice ? <p className="error-text">{notice}</p> : null}
      <form className="grid-form" onSubmit={handleLogin}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
};
