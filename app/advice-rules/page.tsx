// Advice Rules editor (refs ISSUE-18, spec section 6.5).
// List rules with enabled toggle, reason, source, edit, add, delete.
// Starting rules from spec 6.5 are present as editable records from the
// API seed endpoint, not as code constants, and a disabled rule never
// affects scoring (the engine reads only enabled rules).
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../lib/auth';
import { api } from '../../lib/api-client';
import type { AdviceRule } from '../../lib/types';
import { Button, Card, ErrorText, Field, Input, Select, SecondaryButton } from '../../components/ui';

export default function AdviceRulesPage() {
  const { user, loading } = useRequireAuth();
  const [rules, setRules] = useState<AdviceRule[]>([]);
  const [editing, setEditing] = useState<AdviceRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [name, setName] = useState('');
  const [conditionCategory, setConditionCategory] = useState('');
  const [conditionFitTag, setConditionFitTag] = useState('');
  const [action, setAction] = useState<'prefer' | 'avoid' | 'require'>('prefer');
  const [weight, setWeight] = useState('50');
  const [reason, setReason] = useState('');
  const [source, setSource] = useState('User stated fit preference');

  async function load() { const r = await api.listAdviceRules({ pageSize: '100' }); setRules(r.data); }
  useEffect(() => { if (user) load().catch((e) => setError(e instanceof Error ? e.message : 'Could not load rules.')); }, [user]);
  if (loading || !user) return <p>Loading...</p>;

  async function seed() {
    try { const result = await api.seedAdviceRules(); setStatus(result.seeded ? 'Starting rules created.' : 'Starting rules already exist. Nothing was duplicated.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Seed failed.'); }
  }
  async function add() {
    if (!name.trim() || !reason.trim()) { setError('Name and reason are required.'); return; }
    try {
      await api.createAdviceRule({ name: name.trim(), conditionCategory: conditionCategory || null, conditionFitTag: conditionFitTag || null, action, weight: Number(weight) || 50, reason: reason.trim(), source: source.trim() || 'User stated fit preference', enabled: true });
      setName(''); setConditionCategory(''); setConditionFitTag(''); setReason(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Add failed.'); }
  }
  async function saveEdit() {
    if (!editing) return;
    try {
      await api.patchAdviceRule(editing.id, { name: editing.name, conditionCategory: editing.conditionCategory, conditionFitTag: editing.conditionFitTag, action: editing.action, weight: editing.weight, reason: editing.reason, source: editing.source, enabled: editing.enabled });
      setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">Advice Rules</h1>
        <p className="mt-1 text-sm text-slate-600">These rules shape outfit scoring. A disabled rule never affects scoring. The starting set comes from the API, and every rule here is editable.</p>
        <Button className="mt-3" onClick={seed}>Load starting rules (spec 6.5)</Button>
        {status && <p className="mt-2 text-sm">{status}</p>}
        <ErrorText message={error} />
      </Card>
      <Card>
        <h2 className="font-bold">Add a rule</h2>
        <div className="mt-2 flex flex-col gap-2">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Condition category (optional)"><Input value={conditionCategory} onChange={(e) => setConditionCategory(e.target.value)} placeholder="top or outer" /></Field>
          <Field label="Condition fit tag (optional)"><Input value={conditionFitTag} onChange={(e) => setConditionFitTag(e.target.value)} placeholder="structured shoulder" /></Field>
          <Field label="Action"><Select value={action} onChange={(e) => setAction(e.target.value as 'prefer' | 'avoid' | 'require')}><option value="prefer">prefer</option><option value="avoid">avoid</option><option value="require">require</option></Select></Field>
          <Field label="Weight (0 to 100)"><Input type="number" min="0" max="100" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
          <Field label="Reason"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <Field label="Source"><Input value={source} onChange={(e) => setSource(e.target.value)} /></Field>
          <Button onClick={add}>Add rule</Button>
        </div>
      </Card>
      {rules.map((rule) => (
        <Card key={rule.id}>
          {editing && editing.id === rule.id ? (
            <div className="flex flex-col gap-2">
              <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Reason"><Input value={editing.reason} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} /></Field>
              <Field label="Source"><Input value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })} /></Field>
              <Field label="Weight"><Input type="number" min="0" max="100" value={editing.weight} onChange={(e) => setEditing({ ...editing, weight: Number(e.target.value) })} /></Field>
              <div className="flex gap-2"><Button onClick={saveEdit}>Save</Button><SecondaryButton onClick={() => setEditing(null)}>Cancel</SecondaryButton></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h2 className="font-bold">{rule.name}</h2>
                <label className="ml-auto text-sm"><input type="checkbox" checked={rule.enabled} onChange={async (e) => { await api.patchAdviceRule(rule.id, { enabled: e.target.checked }); await load(); }} /> Enabled</label>
              </div>
              <p className="mt-1 text-sm"><strong>Reason:</strong> {rule.reason}</p>
              <p className="text-sm"><strong>Source:</strong> {rule.source}</p>
              <p className="text-sm text-slate-600">Action: {rule.action} | Weight: {rule.weight} | Category: {rule.conditionCategory || 'any'} | Fit tag: {rule.conditionFitTag || 'any'}</p>
              <div className="mt-2 flex gap-2">
                <SecondaryButton onClick={() => setEditing(rule)}>Edit</SecondaryButton>
                <SecondaryButton onClick={async () => { if (confirm('Delete this rule?')) { await api.deleteAdviceRule(rule.id); await load(); } }}>Delete</SecondaryButton>
              </div>
            </>
          )}
        </Card>
      ))}
      {rules.length === 0 && <Card><p className="text-sm text-slate-600">No rules yet. Use Load starting rules to create the spec 6.5 set.</p></Card>}
    </div>
  );
}
