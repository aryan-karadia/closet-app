// Home placeholder on the auth branch (refs ISSUE-20).
// Replaced by the Outfit Builder home screen on the ISSUE-17 branch.
// No em dashes are used in this file.
'use client';
import Link from 'next/link';
import { useRequireAuth } from '../lib/auth';
import { Card } from '../components/ui';

export default function HomePage() {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return <p>Loading...</p>;
  return (
    <Card>
      <h1 className="text-xl font-bold">Closet</h1>
      <p className="mt-2 text-sm text-slate-600">You are signed in. The Outfit Builder home screen lands on the ISSUE-17 branch.</p>
      <ul className="mt-4 list-disc pl-5 text-sm">
        <li><Link href="/wardrobe">Wardrobe</Link></li>
        <li><Link href="/palette">Palette</Link></li>
        <li><Link href="/advice-rules">Advice rules</Link></li>
        <li><Link href="/outfits">Saved outfits</Link></li>
        <li><Link href="/settings">Settings</Link></li>
      </ul>
    </Card>
  );
}
