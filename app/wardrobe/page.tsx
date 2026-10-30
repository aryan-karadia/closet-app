// Wardrobe grid placeholder on the ISSUE-11 branch (refs ISSUE-11).
// The full grid with filters, sort, and search lands on the ISSUE-12 branch.
// No em dashes are used in this file.
'use client';
import { Card } from '../../components/ui';
import { useRequireAuth } from '../../lib/auth';

export default function WardrobePlaceholder() {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return <p>Loading...</p>;
  return <Card><h1 className="text-xl font-bold">Wardrobe</h1><p className="mt-2 text-sm text-slate-600">The full grid lands on the ISSUE-12 branch. Items can be added and viewed from /items/new and /items/[id] in the meantime.</p></Card>;
}
