// Outfit Builder home screen (refs ISSUE-17, spec sections 6.1, 6.2, 6.3, 10).
// First screen after login. Occasion, season, vibe selectors, Build button,
// 3 outfits with photos, scores, and why it works. Actions: Save, Log worn,
// Shuffle slot, Dislike. Disliked combinations are stored in browser local
// storage (the frozen contract has no dislike endpoint, see the ISSUE-16 PR
// file) and are not suggested again for 30 days. Empty slots are shown as
// missing, never invented. No LLM is used in this path.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../lib/auth';
import { api } from '../lib/api-client';
import type { AdviceRule, Item, Occasion, Season, Vibe } from '../lib/types';
import { OCCASIONS, SEASONS, SLOT_LABELS, VIBES } from '../lib/types';
import { Button, Card, ErrorText, Field, Select, SecondaryButton } from '../components/ui';
import ScoreBadge from '../components/ScoreBadge';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const engine = require('../lib/outfit-engine/index.js');

import { loadDislikes, saveDislike } from '../lib/dislikes';

interface BuiltOutfit {
  items: { itemId: string; slot: string; item: Item }[];
  missingSlots: string[];
  paletteScore: number; fitScore: number; contrastScore: number; rotationScore: number; totalScore: number;
  explanation: string[]; savedId?: string | null;
  occasion?: Occasion;
  hasUnratedItems?: boolean; unratedItemIds?: string[]; allItemsUnrated?: boolean;
}

export default function HomePage() {
  const { user, loading } = useRequireAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [rules, setRules] = useState<AdviceRule[]>([]);
  const [occasion, setOccasion] = useState<Occasion>('daily');
  const [season, setSeason] = useState<Season>('all-season');
  const [vibe, setVibe] = useState<Vibe>('structured-softboy');
  const [outfits, setOutfits] = useState<BuiltOutfit[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.listItems({ pageSize: '100' }).then((r) => setItems(r.data)).catch(() => {
      try { const cached = window.localStorage.getItem('closet_wardrobe_cache'); if (cached) setItems(JSON.parse(cached)); } catch { /* no cache */ }
    });
    api.listAdviceRules({ pageSize: '100' }).then((r) => setRules(r.data)).catch(() => {});
  }, [user]);

  if (loading || !user) return <p>Loading...</p>;

  async function buildWithWorker(input: unknown): Promise<BuiltOutfit[]> {
    try {
      const worker = new Worker(new URL('../lib/outfit-engine/worker.ts', import.meta.url));
      const result = await new Promise<BuiltOutfit[]>((resolve, reject) => {
        const timer = setTimeout(() => { try { worker.terminate(); } catch { /* ignore */ } reject(new Error('Worker timed out.')); }, 10000);
        worker.onmessage = (event: MessageEvent) => { clearTimeout(timer); worker.terminate(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.outfits); };
        worker.onerror = () => { clearTimeout(timer); reject(new Error('Worker failed.')); };
        worker.postMessage({ input });
      });
      return result;
    } catch {
      return engine.buildOutfits(input);
    }
  }

  async function build() {
    setError(null); setStatus(''); setBuilding(true);
    try {
      const result = await buildWithWorker({ items, occasion, season, vibe, adviceRules: rules, disliked: loadDislikes() });
      setOutfits(result);
      if (!result.length) setStatus('No outfit could be built from in rotation items for this occasion and season. Add items, or try a different season.');
      else {
        // Diversity message (refs ISSUE-33): the engine returns fewer
        // than 3 outfits rather than repeating a top and outer pair.
        // The worker may strip the attached message, so fall back to
        // the same explanation when fewer than 3 outfits are returned.
        const diversityMessage = (result as BuiltOutfit[] & { diversityMessage?: string }).diversityMessage;
        if (diversityMessage) setStatus(diversityMessage);
        else if (result.length < 3) setStatus('Only ' + result.length + ' distinct top and outer pair' + (result.length === 1 ? '' : 's') + ' available, so fewer than 3 outfits are shown instead of repeating a pair.');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Build failed.'); }
    setBuilding(false);
  }

  async function saveOutfit(outfit: BuiltOutfit, index: number): Promise<string | null> {
    if (outfit.savedId) return outfit.savedId;
    const created = await api.createOutfit({
      occasion, season, vibe,
      items: outfit.items.map((x) => ({ itemId: x.itemId, slot: x.slot })),
      paletteScore: outfit.paletteScore, fitScore: outfit.fitScore, contrastScore: outfit.contrastScore,
      rotationScore: outfit.rotationScore, totalScore: outfit.totalScore, explanation: outfit.explanation, saved: true,
    });
    setOutfits((list) => list.map((o, i) => (i === index ? { ...o, savedId: created.id } : o)));
    return created.id;
  }

  async function logWorn(outfit: BuiltOutfit, index: number) {
    try {
      const outfitId = await saveOutfit(outfit, index);
      if (!outfitId) return;
      await api.createWearLog({ outfitId, itemIds: outfit.items.map((x) => x.itemId), occasion });
      setStatus('Logged as worn today. Wear counts updated.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Log worn failed.'); }
  }

  function dislike(outfit: BuiltOutfit) {
    saveDislike(outfit.items.map((x) => x.itemId));
    setOutfits((list) => list.filter((o) => o !== outfit));
    setStatus('Disliked. This exact combination will not be suggested again for 30 days.');
  }

  function shuffleSlot(outfit: BuiltOutfit, index: number, slot: string) {
    const current = outfit.items.find((x) => x.slot === slot);
    const disliked = loadDislikes();
    // Route every candidate through the same hard rules as buildOutfits
    // (refs ISSUE-32): status, season, verdict, interview category
    // exclusions, accent count, and disliked combinations. A candidate
    // that fails any check is never picked, even if it has the top score.
    const alternatives = items.filter((item) => engine.slotForCategory(item.category, item.name) === slot && (!current || item.id !== current.itemId)).filter((item) => engine.validateShuffleReplacement({ replacement: item, outfitItems: outfit.items, slot, occasion, season, disliked }).valid);
    if (!alternatives.length) { setStatus('No alternative for ' + SLOT_LABELS[slot as keyof typeof SLOT_LABELS] + ' passes the hard rules for this occasion. The outfit is unchanged.'); return; }
    const replacement = [...alternatives].sort((a, b) => (b.paletteScore || 0) - (a.paletteScore || 0))[0];
    const newItems = outfit.items.map((x) => (x.slot === slot ? { itemId: replacement.id, slot, item: replacement } : x));
    const slots: Record<string, Item | null> = { 'base-top': null, 'outer-layer': null, bottom: null, shoes: null, accessory: null };
    for (const x of newItems) slots[x.slot] = x.item;
    const scores = engine.scoreOutfit(slots, rules);
    // ISSUE-34: a shuffled outfit must carry the same unrated warning
    // as a fresh build. Recompute the warning from the new items and
    // rebuild the explanation warning lines, instead of keeping stale
    // warnings from the pre-shuffle outfit.
    const summary = engine.unratedSummary ? engine.unratedSummary(newItems) : { hasUnratedItems: newItems.some((x) => !x.item.paletteVerdict), unratedItemIds: newItems.filter((x) => !x.item.paletteVerdict).map((x) => x.itemId), allItemsUnrated: newItems.length > 0 && newItems.every((x) => !x.item.paletteVerdict) };
    const warningLines = ['Unrated item included, palette fit not verified', 'All items are unrated, so this is not a verified interview outfit.'];
    const baseExplanation = outfit.explanation.filter((line) => !warningLines.includes(line));
    if (occasion === 'interview' && summary.hasUnratedItems) {
      baseExplanation.push('Unrated item included, palette fit not verified');
      if (summary.allItemsUnrated) baseExplanation.push('All items are unrated, so this is not a verified interview outfit.');
    }
    setOutfits((list) => list.map((o, i) => (i === index ? { ...o, items: newItems, ...scores, explanation: baseExplanation, hasUnratedItems: summary.hasUnratedItems, unratedItemIds: summary.unratedItemIds, allItemsUnrated: summary.allItemsUnrated, savedId: null } : o)));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">Outfit Builder</h1>
        <p className="mt-1 text-sm text-slate-600">Choose an occasion, season, and vibe, then build 3 outfits from your in rotation items. Offline generation works from your last loaded wardrobe; if no wardrobe is cached, connect once to load it.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Occasion"><Select value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion)}>{OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}</Select></Field>
          <Field label="Season"><Select value={season} onChange={(e) => setSeason(e.target.value as Season)}>{SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
          <Field label="Vibe"><Select value={vibe} onChange={(e) => setVibe(e.target.value as Vibe)}>{VIBES.map((v) => <option key={v} value={v}>{v}</option>)}</Select></Field>
        </div>
        <Button className="mt-3" onClick={build} disabled={building}>{building ? 'Building...' : 'Build outfits'}</Button>
        {status && <p className="mt-2 text-sm">{status}</p>}
        <ErrorText message={error} />
      </Card>
      {outfits.map((outfit, index) => (
        <Card key={index}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold">Outfit {index + 1}</h2>
            <ScoreBadge score={outfit.totalScore} verdict={outfit.totalScore >= 90 ? 'Perfect' : outfit.totalScore >= 70 ? 'Strong' : outfit.totalScore >= 50 ? 'Works' : 'Avoid'} />
            <span className="text-sm text-slate-600">Palette {outfit.paletteScore} | Fit {outfit.fitScore} | Contrast {outfit.contrastScore} | Rotation {outfit.rotationScore}</span>
          </div>
          {(outfit.occasion || occasion) === 'interview' && outfit.items.some((x) => !x.item.paletteVerdict) && <p className="mt-2 text-sm text-amber-900">Unrated item included, palette fit not verified</p>}
          {(outfit.occasion || occasion) === 'interview' && outfit.items.length > 0 && outfit.items.every((x) => !x.item.paletteVerdict) && <p className="mt-2 text-sm text-amber-900">Not a verified interview outfit: all items are unrated.</p>}
          <ul className="mt-3 flex flex-col gap-2">
            {outfit.items.map((x) => (
              <li key={x.slot} className="flex items-center gap-3 text-sm">
                {x.item.thumbnailSignedUrl && <img src={x.item.thumbnailSignedUrl} alt={x.item.name} className="h-12 w-12 rounded object-cover" loading="lazy" />}
                <span><strong>{SLOT_LABELS[x.slot as keyof typeof SLOT_LABELS]}:</strong> {x.item.name} ({x.item.category})</span>
                <ScoreBadge score={x.item.paletteScore} verdict={x.item.paletteVerdict} />
                {(outfit.occasion || occasion) === 'interview' && !x.item.paletteVerdict && <span className="text-amber-900">Unrated, palette fit not verified</span>}
                <SecondaryButton onClick={() => shuffleSlot(outfit, index, x.slot)}>Shuffle slot</SecondaryButton>
              </li>
            ))}
          </ul>
          {outfit.missingSlots.length > 0 && <p className="mt-2 text-sm text-amber-900">Missing: {outfit.missingSlots.map((s) => SLOT_LABELS[s as keyof typeof SLOT_LABELS]).join(', ')}. These slots are empty because no matching item is catalogued; nothing was invented.</p>}
          <div className="mt-3">
            <p className="font-medium text-sm">Why this works</p>
            <ul className="list-disc pl-5 text-sm">{outfit.explanation.map((line, i) => <li key={i}>{line}</li>)}</ul>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => saveOutfit(outfit, index)}>Save</Button>
            <SecondaryButton onClick={() => logWorn(outfit, index)}>Log worn</SecondaryButton>
            <SecondaryButton onClick={() => dislike(outfit)}>Dislike</SecondaryButton>
            {outfit.savedId && <span className="text-sm text-slate-600">Saved.</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}
