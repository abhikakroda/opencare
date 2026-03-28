import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthProfile } from '../middleware';
import { supabase } from '../lib/supabase';

const TOKEN_KEY = 'opencare-admin-token';
const PROFILE_KEY = 'opencare-admin-profile';

type AuthContextValue = {
  apiToken: string | null;
  profile: AuthProfile | null;
  hasSession: boolean;
  readOnly: boolean;
  setLegacySession: (token: string, profile: AuthProfile) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredProfile(): AuthProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthProfile;
    if (!parsed || typeof parsed.role !== 'string') {
      return null;
    }
    return {
      role: parsed.role,
      sub_role: parsed.sub_role ?? null,
      email: parsed.email ?? null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiToken, setApiToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_KEY));
  const [profile, setProfile] = useState<AuthProfile | null>(() => readStoredProfile());

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        return;
      }
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(PROFILE_KEY);
      setApiToken(session.access_token);
      const meta = session.user.user_metadata ?? {};
      setProfile({
        role: (meta.role as AuthProfile['role']) ?? 'patient',
        sub_role: (meta.sub_role as AuthProfile['sub_role']) ?? null,
        email: session.user.email ?? null,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        return;
      }
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(PROFILE_KEY);
      setApiToken(session.access_token);
      const meta = session.user.user_metadata ?? {};
      setProfile({
        role: (meta.role as AuthProfile['role']) ?? 'patient',
        sub_role: (meta.sub_role as AuthProfile['sub_role']) ?? null,
        email: session.user.email ?? null,
      });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const setLegacySession = useCallback((token: string, nextProfile: AuthProfile) => {
    setApiToken(token);
    setProfile(nextProfile);
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    if (supabase) {
      void supabase.auth.signOut();
    }
  }, []);

  const signOut = useCallback(() => {
    setApiToken(null);
    setProfile(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(PROFILE_KEY);
    if (supabase) {
      void supabase.auth.signOut();
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const hasSession = Boolean(apiToken);
    const readOnly = profile?.role === 'nodal_officer';
    return {
      apiToken,
      profile,
      hasSession,
      readOnly,
      setLegacySession,
      signOut,
    };
  }, [apiToken, profile, setLegacySession, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
