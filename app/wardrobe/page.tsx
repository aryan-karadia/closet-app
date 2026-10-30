// Wardrobe grid (refs ISSUE-12, spec section 7).
// Photo, category, score badge, verdict, season, fit tags. Filters by
// category, verdict, season, fit tag, status, colour family, search by
// name or tag. Sort by palette score, least worn, recently added, or name.
// Filters and sort use the frozen items list API. The last loaded list is
// cached in local storage so the grid can be viewed offline (ISSUE-27).
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '../../lib/auth';
import { api } from '../../lib/api-client';
import type { Item } from '../../lib/types';
import ScoreBadge from '../../components/ScoreBadge';
import { Button, Card, Field, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui';
import { CATEGORIES, SEASONS, VERDICTS } from '../../lib/types';

const WARDROBE_CACHE_KEY = 'closet_wardrobe_cache';

export default function WardrobePage() {
  const { user, loading } = useRequireAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState('');
  const [verdict, setVerdict] = useState('');
  const [season, setSeason] = useState('');
  const [fitTag, setFitTag] = useState('');
  const [status, setStatus] = useState('');
  const [colourFamily, setColourFamily] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [offline, setOffline] = useState(false);

  async function load() {
    try {
      const params: Record<string, string | undefined> = { category: category || undefined, paletteVerdict: verdict || undefined, season: season || undefined, fitTag: fitTag || undefined, status: status || undefined, colourFamily: colourFamily || undefined, search: search || undefined, sort, pageSize: '100' };
      const result = await api.listItems(params);
      setItems(result.data); setOffline(false);
      try { window.localStorage.setItem(WARDROBE_CACHE_KEY, JSON.stringify(result.data)); } catch { /* cache unavailable */ }
    } catch {
      try {
        const cached = window.localStorage.getItem(WARDROBE_CACHE_KEY);
        if (cached) { setItems(JSON.parse(cached)); setOffline(true); }
      } catch { /* no cache */ }
    }
  }
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !user) return <p>Loading...</p>;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Wardrobe</h1>
          <Link href="/items/new"><Button>Add item</Button></Link>
        </div>
        {offline && <p className="mt-2 text-sm text-amber-900">You are offline. Showing the last loaded wardrobe grid.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Search (name or tag)"><Input value={search} onChange={(e) => setSearch(e.target.value)} /></Field>
          <Field label="Category"><Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : (v ?? ''))}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select></Field>
          <Field label="Verdict"><Select value={verdict || 'all'} onValueChange={(v) => setVerdict(v === 'all' ? '' : (v ?? ''))}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{VERDICTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select></Field>
          <Field label="Season"><Select value={season || 'all'} onValueChange={(v) => setSeason(v === 'all' ? '' : (v ?? ''))}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select></Field>
          <Field label="Fit tag"><Input value={fitTag} onChange={(e) => setFitTag(e.target.value)} placeholder="structured shoulder" /></Field>
          <Field label="Status"><Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : (v ?? ''))}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="in rotation">in rotation</SelectItem><SelectItem value="stored">stored</SelectItem><SelectItem value="archived">archived</SelectItem></SelectContent>
        </Select></Field>
          <Field label="Colour family"><Input value={colourFamily} onChange={(e) => setColourFamily(e.target.value)} placeholder="navy" /></Field>
          <Field label="Sort"><Select value={sort} onValueChange={(v) => setSort(v ?? '')}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="paletteScore">Palette score</SelectItem><SelectItem value="wearCount">Least worn</SelectItem><SelectItem value="recent">Recently added</SelectItem><SelectItem value="name">Name</SelectItem></SelectContent>
        </Select></Field>
        </div>
        <Button className="mt-3" onClick={load}>Apply filters</Button>
      </Card>
      {items.length === 0 && <Card><p className="text-sm text-slate-600">No items match these filters yet. Add your first item from the Add item button.</p></Card>}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Link key={item.id} href={'/items/' + item.id}>
            <Card className="h-full">
              {item.thumbnailSignedUrl && <img src={item.thumbnailSignedUrl} alt={item.name} className="h-32 w-full rounded object-cover" loading="lazy" />}
              <p className="mt-2 font-medium">{item.name}</p>
              <p className="text-sm text-slate-600">{item.category} | {item.season}</p>
              <div className="mt-1"><ScoreBadge score={item.paletteScore} verdict={item.paletteVerdict} /></div>
              <p className="mt-1 text-xs text-slate-600">{(item.fitTags || []).join(', ')}</p>
              <p className="text-xs text-slate-600">Worn {item.wearCount} times</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
