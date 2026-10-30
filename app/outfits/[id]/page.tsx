// Saved outfit detail (refs ISSUE-19).
// Items, scores, explanation, Log worn, Delete. Photos are loaded per item
// when a signed thumbnail is available.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '../../../lib/auth';
import { api } from '../../../lib/api-client';
import type { Item, Outfit } from '../../../lib/types';
import { Button, Card, ErrorText } from '../../../components/ui';
import ScoreBadge from '../../../components/ScoreBadge';

export default function OutfitDetailPage() {
  const { user, loading } = useRequireAuth();
  const params = useParams();
  const id = String(params.id);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    api.getOutfit(id).then(async (o) => {
      setOutfit(o);
      const map: Record<string, string> = {};
      for (const x of o.items || []) {
        try { const item: Item = await api.getItem(x.itemId); if (item.thumbnailSignedUrl) map[x.itemId] = item.thumbnailSignedUrl; } catch { /* photo unavailable */ }
      }
      setPhotos(map);
    }).catch((e) => setError(e instanceof Error ? e.message : 'Could not load outfit.'));
  }, [user, id]);
  if (loading || !user) return <p>Loading...</p>;
  if (error) return <ErrorText message={error} />;
  if (!outfit) return <p>Loading outfit...</p>;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">{outfit.occasion} outfit</h1>
        <p className="mt-1 text-sm text-slate-600">Saved {outfit.createdAt ? new Date(outfit.createdAt).toLocaleString() : ''} | Season {outfit.season} | Vibe {outfit.vibe || 'none'}</p>
        <div className="mt-2"><ScoreBadge score={outfit.totalScore} verdict={outfit.totalScore !== null && outfit.totalScore !== undefined ? (outfit.totalScore >= 90 ? 'Perfect' : outfit.totalScore >= 70 ? 'Strong' : outfit.totalScore >= 50 ? 'Works' : 'Avoid') : null} /></div>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {(outfit.items || []).map((x) => (
            <li key={x.itemId} className="flex items-center gap-2">
              {photos[x.itemId] && <img src={photos[x.itemId]} alt={x.itemName || ''} className="h-12 w-12 rounded object-cover" loading="lazy" />}
              <span><strong>{x.slot}:</strong> {x.itemName || x.itemId}</span>
            </li>
          ))}
        </ul>
        {(outfit.items || []).length === 0 && <p className="mt-2 text-sm text-slate-600">This outfit has no items.</p>}
        <div className="mt-3">
          <p className="font-medium text-sm">Why this works</p>
          <ul className="list-disc pl-5 text-sm">{(outfit.explanation || []).map((line, i) => <li key={i}>{line}</li>)}</ul>
        </div>
        {status && <p className="mt-2 text-sm">{status}</p>}
        <div className="mt-3 flex gap-2">
          <Button onClick={async () => { try { const itemIds = (outfit.items || []).map((x) => x.itemId); await api.createWearLog({ outfitId: outfit.id, itemIds, occasion: outfit.occasion }); setStatus('Logged as worn today.'); } catch (e) { setError(e instanceof Error ? e.message : 'Log worn failed.'); } }}>Log worn</Button>
          <Button variant="outline" onClick={async () => { if (confirm('Delete this saved outfit?')) { await api.deleteOutfit(outfit.id); window.location.href = '/outfits'; } }}>Delete</Button>
        </div>
      </Card>
    </div>
  );
}
