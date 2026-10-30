// Item detail page (refs ISSUE-11, spec section 7).
// Photo, score badge (number plus verdict), dominant colours with
// percentages, nearest palette colour, reason, manual override note,
// wear history, outfits using this item, edit, soft delete, restore.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '../../../lib/auth';
import { api } from '../../../lib/api-client';
import type { Item, Outfit } from '../../../lib/types';
import ScoreBadge from '../../../components/ScoreBadge';
import { Button, Card, ErrorText, SecondaryButton } from '../../../components/ui';

export default function ItemDetailPage() {
  const { user, loading } = useRequireAuth();
  const params = useParams();
  const id = String(params.id);
  const [item, setItem] = useState<Item | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    api.getItem(id).then(setItem).catch((e) => setError(e instanceof Error ? e.message : 'Could not load item.'));
    api.listOutfits({ pageSize: 100 }).then((r) => setOutfits(r.data.filter((o) => (o.items || []).some((x) => x.itemId === id)))).catch(() => {});
  }, [user, id]);
  if (loading || !user) return <p>Loading...</p>;
  if (error) return <ErrorText message={error} />;
  if (!item) return <p>Loading item...</p>;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">{item.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2"><ScoreBadge score={item.paletteScore} verdict={item.paletteVerdict} /><span className="text-sm text-slate-600">{item.category} | {item.season} | {item.status}</span></div>
        {item.photoSignedUrl && <img src={item.photoSignedUrl} alt={item.name} className="mt-3 max-h-96 rounded border" />}
        {!item.photoSignedUrl && <p className="mt-3 text-sm text-slate-600">No photo stored for this item.</p>}
        <div className="mt-3 text-sm">
          <p><strong>Nearest palette colour:</strong> {item.nearestPaletteColorName || 'None yet'}</p>
          <p><strong>Reason:</strong> {item.ratingReason || 'No rating reason stored.'}</p>
          {item.autoScore !== null && item.autoScore !== undefined && <p><strong>Auto score:</strong> {item.autoScore}</p>}
          {item.manualScore !== null && item.manualScore !== undefined && <p><strong>Manual override:</strong> {item.manualScore}{item.manualScoreNote ? ' (' + item.manualScoreNote + ')' : ''}</p>}
          <p><strong>Fit tags:</strong> {(item.fitTags || []).join(', ') || 'None'}</p>
          <p><strong>Wear count:</strong> {item.wearCount} | <strong>Last worn:</strong> {item.lastWornAt || 'Never'} | <strong>Cost per wear:</strong> {item.costPerWear !== null && item.costPerWear !== undefined ? item.costPerWear : 'Unknown (enter a price and log a wear)'}</p>
          <p><strong>Price:</strong> {item.price !== null && item.price !== undefined ? item.price : 'Not entered'}</p>
        </div>
        <div className="mt-3">
          <p className="font-medium text-sm">Dominant colours</p>
          {(item.colours || []).length === 0 && <p className="text-sm text-slate-600">No dominant colours stored.</p>}
          <ul className="mt-1 flex flex-wrap gap-2 text-sm">
            {(item.colours || []).map((c, i) => <li key={i} className="flex items-center gap-1"><span className="inline-block h-5 w-5 rounded border" style={{ background: c.hex }} />{c.hex} {c.percentage}%{c.isPrimary ? ' (primary)' : ''}</li>)}
          </ul>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={'/items/' + item.id + '/edit'}><Button>Edit</Button></Link>
          <SecondaryButton onClick={async () => { if (confirm('Delete this item? It can be restored within 30 days.')) { await api.deleteItem(item.id); window.location.href = '/wardrobe'; } }}>Delete (soft delete)</SecondaryButton>
          <SecondaryButton onClick={async () => { await api.restoreItem(item.id); window.location.reload(); }}>Restore within 30 days</SecondaryButton>
          <SecondaryButton onClick={async () => { if (confirm('Permanently delete this item? This cannot be undone.')) { await api.permanentDeleteItem(item.id); window.location.href = '/wardrobe'; } }}>Permanent delete</SecondaryButton>
        </div>
      </Card>
      <Card>
        <h2 className="font-bold">Outfits using this item</h2>
        {outfits.length === 0 && <p className="text-sm text-slate-600">No saved outfits use this item yet.</p>}
        <ul className="mt-2 text-sm">{outfits.map((o) => <li key={o.id}><Link href={'/outfits/' + o.id}>{o.occasion} outfit, saved {o.createdAt || ''}</Link></li>)}</ul>
      </Card>
    </div>
  );
}
