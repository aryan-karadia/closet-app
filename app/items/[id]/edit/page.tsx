// Item edit page (refs ISSUE-11, spec section 5.4).
// Correct any auto field, change status, or set a manual score override
// with a note. The auto score is never overwritten silently.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '../../../../lib/auth';
import { api } from '../../../../lib/api-client';
import { Button, Card, ErrorText, Field, Input, Select, SecondaryButton } from '../../../../components/ui';
import { CATEGORIES, SEASONS } from '../../../../lib/types';

export default function EditItemPage() {
  const { user, loading } = useRequireAuth();
  const params = useParams();
  const id = String(params.id);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('sweater');
  const [season, setSeason] = useState('all-season');
  const [fitTags, setFitTags] = useState('');
  const [status, setStatus] = useState('in rotation');
  const [price, setPrice] = useState('');
  const [manualScore, setManualScore] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!user) return;
    api.getItem(id).then((item) => {
      setName(item.name); setCategory(item.category); setSeason(item.season);
      setFitTags((item.fitTags || []).join(', ')); setStatus(item.status);
      setPrice(item.price !== null && item.price !== undefined ? String(item.price) : '');
      setManualScore(item.manualScore !== null && item.manualScore !== undefined ? String(item.manualScore) : '');
      setManualNote(item.manualScoreNote || ''); setReady(true);
    }).catch((e) => setError(e instanceof Error ? e.message : 'Could not load item.'));
  }, [user, id]);
  if (loading || !user || !ready) return <p>Loading...</p>;
  async function save() {
    setError(null);
    try {
      await api.patchItem(id, {
        name: name.trim(), category, season,
        fitTags: fitTags.split(',').map((t) => t.trim()).filter(Boolean),
        status, price: price ? Number(price) : null,
        manualScore: manualScore ? Number(manualScore) : null,
        manualScoreNote: manualNote || null,
      });
      window.location.href = '/items/' + id;
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
  }
  return (
    <Card>
      <h1 className="text-xl font-bold">Edit item</h1>
      <div className="mt-3 flex flex-col gap-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        <Field label="Season"><Select value={season} onChange={(e) => setSeason(e.target.value)}>{SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        <Field label="Fit tags (comma separated)"><Input value={fitTags} onChange={(e) => setFitTags(e.target.value)} /></Field>
        <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="in rotation">in rotation</option><option value="stored">stored</option><option value="archived">archived</option></Select></Field>
        <Field label="Price (optional)"><Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Manual score override (optional, 0 to 100)"><Input type="number" min="0" max="100" value={manualScore} onChange={(e) => setManualScore(e.target.value)} /></Field>
        <Field label="Manual score note"><Input value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="looks better in person" /></Field>
        <p className="text-sm text-slate-600">Clearing the manual score restores the auto score as the effective score.</p>
        <ErrorText message={error} />
        <div className="flex gap-2"><Button onClick={save}>Save changes</Button><SecondaryButton onClick={() => { setManualScore(''); setManualNote(''); }}>Clear override (then save)</SecondaryButton></div>
      </div>
    </Card>
  );
}
