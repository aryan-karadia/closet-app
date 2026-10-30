// Supabase Auth callback (refs ISSUE-20). Exchanges the code for a session, then goes home.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase-client';
import { setToken } from '../../../lib/api-client';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Signing you in...');
  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!supabase || !code) { window.location.href = '/sign-in'; return; }
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) { setMessage('Sign in failed: ' + (error?.message || 'no session')); return; }
      setToken(data.session.access_token);
      window.location.href = '/';
    }
    run();
  }, []);
  return <p>{message}</p>;
}
