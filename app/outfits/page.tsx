// Saved Outfits placeholder on the ISSUE-18 branch (refs ISSUE-18).
// The full saved outfits screen lands on the ISSUE-19 branch.
// No em dashes are used in this file.
'use client';
import { Card } from '../../components/ui';
import { useRequireAuth } from '../../lib/auth';

export default function OutfitsPlaceholder() {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return <p>Loading...</p>;
  return <Card><h1 className="text-xl font-bold">Saved Outfits</h1><p className="mt-2 text-sm text-slate-600">The full saved outfits screen lands on the ISSUE-19 branch.</p></Card>;
}
