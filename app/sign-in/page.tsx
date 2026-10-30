// Sign in page (refs ISSUE-20). Google sign in only in production.
// Local test mode only: a labelled test sign in for the local dev server.
// No em dashes are used in this file.
'use client';
import { useState } from 'react';
import { useAuth, supabaseConfigured } from '../../lib/auth';
import { Button, Card, ErrorText, Field, Input } from '../../components/ui';

export default function SignInPage() {
  const { user, signInGoogle, devSignIn, loading } = useAuth();
  const [userId, setUserId] = useState('user-1');
  const [error, setError] = useState<string | null>(null);
  if (!loading && user && typeof window !== 'undefined') { window.location.href = '/'; }
  return (
    <Card>
      <h1 className="text-xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in with Google to use your closet. No other sign in method is offered in MVP.</p>
      <div className="mt-4 flex flex-col gap-3">
        <Button onClick={async () => { try { await signInGoogle(); } catch (e) { setError(e instanceof Error ? e.message : 'Sign in failed.'); } }}>
          Sign in with Google
        </Button>
        {!supabaseConfigured && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-medium">Local test mode only</p>
            <p className="text-sm text-slate-600">No Supabase project is configured, so Google sign in is not available here. Use a local test user id against the local dev server (CLOSET_TEST_MODE=1). This option is not a production auth method.</p>
            <div className="mt-2 flex gap-2">
              <Field label="Test user id"><Input value={userId} onChange={(e) => setUserId(e.target.value)} /></Field>
              <Button className="mt-5" onClick={async () => { try { await devSignIn(userId); window.location.href = '/'; } catch (e) { setError(e instanceof Error ? e.message : 'Test sign in failed. Is the dev server running?'); } }}>Test sign in</Button>
            </div>
          </div>
        )}
        <ErrorText message={error} />
      </div>
    </Card>
  );
}
