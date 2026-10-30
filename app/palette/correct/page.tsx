// Correction screen placeholder on the ISSUE-03 branch (refs ISSUE-03).
// The full correction screen lands on the ISSUE-04 branch.
// No em dashes are used in this file.
'use client';
import { Card } from '../../../components/ui';
import { useRequireAuth } from '../../../lib/auth';

export default function CorrectPlaceholder() {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return <p>Loading...</p>;
  return <Card><h1 className="text-xl font-bold">Palette correction</h1><p className="mt-2 text-sm text-slate-600">The full correction screen (rename, role, hex, delete, add, Remove beauty colours, summary) lands on the ISSUE-04 branch. Your extracted draft is kept in session storage until then.</p></Card>;
}
