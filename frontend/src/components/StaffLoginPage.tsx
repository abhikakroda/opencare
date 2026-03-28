import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getHomePathForUser, type AuthProfile } from '../middleware';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const StaffLoginPage = () => {
  const { setLegacySession, hasSession, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSession && profile) {
      navigate(getHomePathForUser(profile), { replace: true });
    }
  }, [hasSession, profile, navigate]);

  const [email, setEmail] = useState('admin@opencare.local');
  const [password, setPassword] = useState('ChangeThis123');
  const [error, setError] = useState('');

  const handleLegacyLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post<{ token: string; profile: AuthProfile }>('/auth/login', { email, password });
      setLegacySession(response.token, {
        role: response.profile.role,
        sub_role: response.profile.sub_role ?? null,
        email: response.profile.email ?? email,
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    }
  };

  const handleSupabaseLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!supabase) {
      setError('Supabase is not configured in this build.');
      return;
    }

    try {
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) {
        setError(signError.message);
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    }
  };

  return (
    <main className="page-shell">
      <section className="hero compact-hero">
        <div className="hero-copy">
          <p className="eyebrow">Staff &amp; officer access</p>
          <h1>Sign in to reach your workspace</h1>
          <p className="hero-text">
            Use the legacy admin account for JWT access, or Supabase Auth with{' '}
            <code>user_metadata.role</code> / <code>sub_role</code> set on the user.
          </p>
        </div>
      </section>

      <section className="panel admin-login">
        <p className="eyebrow">Legacy admin (JWT)</p>
        <form className="grid-form" onSubmit={handleLegacyLogin}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
          />
          <button type="submit">Continue with JWT</button>
        </form>

        <hr style={{ margin: '1.5rem 0', opacity: 0.2 }} />

        <p className="eyebrow">Supabase Auth</p>
        <form className="grid-form" onSubmit={handleSupabaseLogin}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
          />
          <button type="submit">Continue with Supabase</button>
        </form>

        {error ? <p className="error-text">{error}</p> : null}

        <p className="hero-text" style={{ marginTop: '1rem' }}>
          <Link to="/">← Back to patient home</Link>
        </p>
      </section>
    </main>
  );
};
