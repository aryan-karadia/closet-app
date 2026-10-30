// Saved Outfits screen (refs ISSUE-19, spec sections 6.4 and 10).
// List saved outfits with occasion and date saved, Log worn action, and a
// Wear this interview outfit shortcut when an interview outfit is saved.
// Saved outfits are also cached in local storage for offline viewing (ISSUE-27).
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '../../lib/auth';
import { api } from '../../lib/api-client';
import type { Outfit } from '../../lib/types';
import { Button, Card, ErrorText, SecondaryButton } from '../../components/ui';
import ScoreBadge from '../../components/ScoreBadge';

export default function SavedOutfitsPage() {
  const { user, loading } = useRequireAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  async function load() {
    try {
      const result = await api.listOutfits({ saved: true, pageSize: '100' });
      setOutfits(result.data); setOffline(false);
      try { window.localStorage.setItem('closet_saved_outfits_cache', JSON.stringify(result.data)); } catch { /* cache unavailable */ }
    } catch {
      try { const cached = window.localStorage.getItem('closet_saved_outfits_cache'); if (cached) { setOutfits(JSON.parse(cached)); setOffline(true); } } catch { /* no cache */ }
    }
  }
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading || !user) return <p>Loading...</p>;

  const interview = outfits.find((o) => o.occasion === 'interview');
  async function logWorn(outfit: Outfit) {
    try {
      const full = await api.getOutfit(outfit.id);
      const itemIds = (full.items || []).map((x) => x.itemId);
      if (!itemIds.length) { setError('This outfit has no items to log.'); return; }
      await api.createWearLog({ outfitId: outfit.id, itemIds, occasion: outfit.occasion });
      setStatus('Logged as worn today for the ' + outfit.occasion + ' outfit.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Log worn failed.'); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">Saved Outfits</h1>
        {offline && <p className="mt-2 text-sm text-amber-900">You are offline. Showing the last loaded saved outfits.</p>}
        {status && <p className="mt-2 text-sm">{status}</p>}
        <ErrorText message={error} />
      </Card>
      {interview && (
        <Card>
          <h2 className="font-bold">Wear this interview outfit</h2>
          <p className="mt-1 text-sm text-slate-600">Your saved interview outfit, saved {interview.createdAt ? new Date(interview.createdAt).toLocaleDateString() : ''}.</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => logWorn(interview)}>Log worn today</Button>
            <Link href={'/outfits/' + interview.id}><SecondaryButton>View outfit</SecondaryButton></Link>
          </div>
        </Card>
      )}
      {outfits.length === 0 && <Card><p className="text-sm text-slate-600">No saved outfits yet. Build outfits on the home screen and save one.</p></Card>}
      {outfits.map((outfit) => (
        <Card key={outfit.id}>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={'/outfits/' + outfit.id} className="font-bold">{outfit.occasion} outfit</Link>
            <ScoreBadge score={outfit.totalScore} verdict={outfit.totalScore !== null && outfit.totalScore !== undefined ? (outfit.totalScore >= 90 ? 'Perfect' : outfit.totalScore >= 70 ? 'Strong' : outfit.totalScore >= 50 ? 'Works' : 'Avoid') : null} />
            <span className="text-sm text-slate-600">Saved {outfit.createdAt ? new Date(outfit.createdAt).toLocaleDateString() : 'unknown date'} | Season {outfit.season} | Vibe {outfit.vibe || 'none'}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => logWorn(outfit)}>Log worn</Button>
            <SecondaryButton onClick={async () => { if (confirm('Delete this saved outfit?')) { await api.deleteOutfit(outfit.id); await load(); } }}>Delete</SecondaryButton>
          </div>
        </Card>
      ))}
    </div>
  );
}
