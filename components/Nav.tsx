// App navigation (refs ISSUE-20). Mobile first, simple text links.
// No em dashes are used in this file.
'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth';

export default function Nav() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <header className="border-b border-sage bg-cream">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <Link href="/" className="font-bold text-moss">Closet</Link>
        <Link href="/wardrobe">Wardrobe</Link>
        <Link href="/items/new">Add item</Link>
        <Link href="/palette">Palette</Link>
        <Link href="/advice-rules">Advice rules</Link>
        <Link href="/outfits">Saved outfits</Link>
        <Link href="/settings">Settings</Link>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-slate-500">{user.email || user.id}</span>
          <button onClick={() => signOut().then(() => { window.location.href = '/sign-in'; })} className="rounded-md border border-sage bg-white px-2 py-1">Sign out</button>
        </span>
      </nav>
    </header>
  );
}
