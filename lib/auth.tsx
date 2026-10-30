// Auth context: Google sign in via Supabase Auth only (refs ISSUE-20).
// No other auth method in MVP. In local test mode only, a test token of the
// form test:<user-id> is accepted by the local dev server, and the sign in
// page offers a clearly labelled local test sign in for that mode only.
// No em dashes are used in this file.
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api-client';
import { supabase, supabaseConfigured } from './supabase-client';

export interface AuthUser { id: string; email: string | null }
interface AuthState {
  user: AuthUser | null; token: string | null; loading: boolean;
  signInGoogle: () => Promise<void>;
  devSignIn: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthState>({
  user: null, token: null, loading: true,
  signInGoogle: async () => {}, devSignIn: async () => {}, signOut: async () => {},
});
export function useAuth() { return useContext(Ctx); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setToken(data.session.access_token); setTokenState(data.session.access_token);
          setUser({ id: data.session.user.id, email: data.session.user.email || null });
        } else {
          const local = getToken();
          if (local) {
            try {
              const session = await api.session();
              setUser(session.user); setTokenState(local);
            } catch { setToken(null); setTokenState(null); }
          }
        }
        setLoading(false);
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session) { setToken(session.access_token); setTokenState(session.access_token); setUser({ id: session.user.id, email: session.user.email || null }); }
          else if (!getToken()?.startsWith('test:')) { setUser(null); setTokenState(null); }
        });
        return;
      }
      const local = getToken();
      if (local) {
        try { const session = await api.session(); if (!cancelled) { setUser(session.user); setTokenState(local); } }
        catch { setToken(null); }
      }
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  async function signInGoogle() {
    if (!supabase) throw new Error('Google sign in needs a Supabase project. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  }
  async function devSignIn(userId: string) {
    const value = 'test:' + userId.trim();
    setToken(value);
    const session = await api.session();
    setUser(session.user); setTokenState(value);
  }
  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setToken(null); setUser(null); setTokenState(null);
  }
  return <Ctx.Provider value={{ user, token, loading, signInGoogle, devSignIn, signOut }}>{children}</Ctx.Provider>;
}

export function useRequireAuth() {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.loading && !auth.user && typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
  }, [auth.loading, auth.user]);
  return auth;
}
export { supabaseConfigured };
