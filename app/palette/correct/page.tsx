// Palette correction screen (refs ISSUE-04, spec section 4.3 step 4).
// Rename, change role, change hex, delete, add, Remove beauty colours with
// undo, summary with counts and warnings. Nothing is final until the user
// approves and saves. Save consumes only the frozen palette API.
// No em dashes are used in this file.
'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '../../../lib/auth';
import { api } from '../../../lib/api-client';
import { Button, Card, Checkbox, ErrorText, Field, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ingester = require('../../../lib/palette-ingester.js');

interface DraftColour {
  id: string; name: string; hex: string | null; family: string; role: 'core' | 'neutral' | 'avoid';
  sourcePage: number | null; beauty: boolean; isAvoidRule?: boolean; isManual?: boolean;
}

const STARTING_HEX: Record<string, string> = {
  'Royal Blue': '#4169E1', 'Emerald Green': '#046A38', 'Rich Purple': '#7B2D8E', 'True Red': '#C1272D',
  'Deep Teal': '#00696B', 'Rich Plum': '#6E214F', 'Dark Burgundy': '#6B1D2A', 'Charcoal Gray': '#36454F',
  Navy: '#12284B', 'Cool Black': '#0A0E14', 'Cool White': '#E6EAEE',
};
const AVOID_RANGES: Record<string, { hueMin: number; hueMax: number; saturationMin: number; saturationMax: number; lightnessMin: number; lightnessMax: number }> = {
  'warm oranges': { hueMin: 20, hueMax: 50, saturationMin: 41, saturationMax: 100, lightnessMin: 30, lightnessMax: 70 },
  'light pastels': { hueMin: 0, hueMax: 360, saturationMin: 0, saturationMax: 44, lightnessMin: 76, lightnessMax: 100 },
  'muted earthy hues': { hueMin: 20, hueMax: 90, saturationMin: 10, saturationMax: 45, lightnessMin: 25, lightnessMax: 65 },
};

function CorrectionInner() {
  const { user, loading } = useRequireAuth();
  const params = useSearchParams();
  const [colours, setColours] = useState<DraftColour[]>([]);
  const [removed, setRemoved] = useState<DraftColour[]>([]);
  const [paletteName, setPaletteName] = useState('Deep Winter');
  const [fileName, setFileName] = useState<string | null>(null);
  const [activate, setActivate] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#12284B');
  const [newRole, setNewRole] = useState<'core' | 'neutral' | 'avoid'>('core');
  const [newFamily, setNewFamily] = useState('navy');

  useEffect(() => {
    const paletteId = params.get('paletteId');
    if (paletteId) {
      api.getPalette(paletteId).then((p) => {
        setPaletteName(p.name); setFileName(p.sourceFileName || null);
        setColours((p.colours || []).map((c) => ({ id: c.id, name: c.name, hex: c.hex, family: c.family, role: c.role, sourcePage: c.sourcePage || null, beauty: false })));
      }).catch((e) => setError(e instanceof Error ? e.message : 'Could not load palette.'));
      return;
    }
    try {
      const raw = window.sessionStorage.getItem('closet_palette_draft');
      if (raw) {
        const draft = JSON.parse(raw);
        setFileName(draft.fileName || null);
        setColours((draft.colours || []).map((c: DraftColour, i: number) => ({
          id: 'draft-' + i, name: c.name, hex: c.hex || STARTING_HEX[c.name] || null,
          family: c.family, role: c.role, sourcePage: c.sourcePage, beauty: Boolean(c.beauty), isAvoidRule: Boolean(c.isAvoidRule),
        })));
      }
    } catch { /* no draft */ }
  }, [params]);

  if (loading || !user) return <p>Loading...</p>;
  const summary = ingester.summarizeColours(colours) as { core: number; neutral: number; avoid: number; total: number; warnings: string[] };

  function update(id: string, patch: Partial<DraftColour>) {
    setColours((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeBeauty() {
    const result = ingester.removeBeautyColours(colours) as { kept: DraftColour[]; removed: DraftColour[] };
    setRemoved((prev) => [...prev, ...result.removed]);
    setColours(result.kept);
  }
  function undoRemove() {
    setColours((list) => [...list, ...removed]); setRemoved([]);
  }
  function addColour() {
    if (!newName.trim()) { setError('A colour name is required.'); return; }
    setColours((list) => [...list, { id: 'manual-' + Date.now(), name: newName.trim(), hex: newHex, family: newFamily, role: newRole, sourcePage: null, beauty: false, isManual: true }]);
    setNewName('');
  }
  async function save() {
    setError(null); setStatus('');
    const missingHex = colours.filter((c) => !c.isAvoidRule && !c.hex);
    if (missingHex.length) { setError('Set a hex for every colour before saving: ' + missingHex.map((c) => c.name).join(', ') + '.'); return; }
    try {
      const palette = await api.createPalette({ name: paletteName.trim() || 'Deep Winter', sourceFileName: fileName, isActive: activate });
      for (const c of colours) {
        if (c.isAvoidRule) {
          const range = AVOID_RANGES[c.name.toLowerCase()];
          if (range) await api.createAvoidRule(palette.id, { name: c.name, ...range, description: 'Avoid rule from palette PDF text.' });
        } else if (c.hex) {
          await api.createPaletteColour(palette.id, { name: c.name, hex: c.hex, family: c.family, role: c.role, sourcePage: c.sourcePage, isManual: Boolean(c.isManual) });
        }
      }
      if (activate) {
        const result = await api.reratePalette(palette.id);
        setStatus('Saved and activated. Re-rated ' + result.reratedCount + ' items, skipped ' + result.skippedCount + ' of ' + result.totalCount + '.');
      } else {
        setStatus('Saved. Activate it from the Palette page to use it for rating.');
      }
      try { window.sessionStorage.removeItem('closet_palette_draft'); } catch { /* ignore */ }
      window.location.href = '/palette';
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">Palette correction</h1>
        <p className="mt-1 text-sm text-slate-600">Nothing here is final until you approve and save. Beauty colours are flagged and can be removed in one tap, with undo.</p>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Palette name"><Input value={paletteName} onChange={(e) => setPaletteName(e.target.value)} /></Field>
          <div className="flex items-center gap-2"><Checkbox checked={activate} onCheckedChange={(v) => setActivate(v === true)} /><Label>Activate this palette and re-rate items on save</Label></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={removeBeauty}>Remove beauty colours</Button>
            {removed.length > 0 && <Button variant="outline" onClick={undoRemove}>Undo remove ({removed.length})</Button>}
            <Button onClick={save}>Approve and save</Button>
          </div>
          <p className="text-sm">Summary: {summary.core} core, {summary.neutral} neutral, {summary.avoid} avoid, {summary.total} total.</p>
          {summary.warnings.map((w: string) => <p key={w} role="alert" className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">{w}</p>)}
          {status && <p className="text-sm">{status}</p>}
          <ErrorText message={error} />
        </div>
      </Card>
      <Card>
        <h2 className="font-bold">Add a colour manually</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Field label="Name"><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></Field>
          <Field label="Hex"><Input type="color" value={newHex} onChange={(e) => setNewHex(e.target.value)} /></Field>
          <Field label="Role"><Select value={newRole} onValueChange={(v) => setNewRole((v ?? '') as 'core' | 'neutral' | 'avoid')}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="core">core</SelectItem><SelectItem value="neutral">neutral</SelectItem><SelectItem value="avoid">avoid</SelectItem></SelectContent>
        </Select></Field>
          <Field label="Family"><Input value={newFamily} onChange={(e) => setNewFamily(e.target.value)} /></Field>
          <Button className="mt-5" onClick={addColour}>Add colour</Button>
        </div>
      </Card>
      {colours.length === 0 && <Card><p className="text-sm text-slate-600">No colours in this draft yet. Upload a PDF on the Palette page, or add colours manually above.</p></Card>}
      {colours.map((c) => (
        <Card key={c.id}>
          <div className="flex items-center gap-3">
            <span className="inline-block h-10 w-10 rounded border" style={{ background: c.hex || '#ffffff' }} />
            <div className="flex-1">
              <Field label="Name"><Input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} /></Field>
            </div>
            <Button variant="outline" onClick={() => setColours((list) => list.filter((x) => x.id !== c.id))}>Delete</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Field label="Hex"><Input value={c.hex || ''} placeholder="#RRGGBB" onChange={(e) => update(c.id, { hex: e.target.value || null })} /></Field>
            <Field label="Role"><Select value={c.role} onValueChange={(v) => update(c.id, { role: (v ?? c.role) as 'core' | 'neutral' | 'avoid' })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="core">core</SelectItem><SelectItem value="neutral">neutral</SelectItem><SelectItem value="avoid">avoid</SelectItem></SelectContent>
        </Select></Field>
            <span className="mt-6 text-sm text-slate-600">Source page: {c.sourcePage || 'manual'}{c.beauty ? ' [beauty]' : ''}{c.isAvoidRule ? ' [avoid rule, no hex needed]' : ''}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function CorrectionPage() {
  return <Suspense fallback={<p>Loading...</p>}><CorrectionInner /></Suspense>;
}
