// Settings and profile edit (refs ISSUE-22, spec sections 10 and 16.7).
// Profile (build, fit, sizes, style direction), palette management link,
// data export link, delete account confirmation, storage usage warning at
// 80 percent. Two honest limits, documented here and in the PR file:
// the frozen contract has no account delete endpoint, so the delete flow
// confirms and then reports that it is blocked pending Agent D routing,
// instead of pretending to delete; and no storage usage endpoint exists,
// so usage is estimated from items with photos at about 200KB each
// against the 1GB Supabase free tier limit, with a warning at 80 percent.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '../../lib/auth';
import { api } from '../../lib/api-client';
import type { Palette, Profile } from '../../lib/types';
import { Button, Card, ErrorText, Field, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui';
import PwaInstall from '../../components/PwaInstall';

const FREE_TIER_BYTES = 1024 * 1024 * 1024;
const ESTIMATED_BYTES_PER_PHOTO = 200 * 1024;

export default function SettingsPage() {
  const { user, loading, signOut } = useRequireAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [fitTags, setFitTags] = useState('');
  const [styleDirection, setStyleDirection] = useState('');
  const [activePaletteId, setActivePaletteId] = useState('');
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.getProfile().then((p) => {
      setProfile(p); setDisplayName(p.displayName || ''); setFitTags((p.fitTags || []).join(', '));
      setStyleDirection(p.styleDirection || ''); setActivePaletteId(p.activePaletteId || '');
    }).catch((e) => setError(e instanceof Error ? e.message : 'Could not load profile.'));
    api.listPalettes().then((r) => setPalettes(r.data)).catch(() => {});
    api.listItems({ pageSize: '100' }).then((r) => setPhotoCount(r.data.filter((item) => item.photoPath).length)).catch(() => {});
  }, [user]);
  if (loading || !user) return <p>Loading...</p>;

  const estimatedBytes = photoCount * ESTIMATED_BYTES_PER_PHOTO;
  const percent = Math.round((estimatedBytes / FREE_TIER_BYTES) * 1000) / 10;

  async function saveProfile() {
    setError(null);
    try {
      const updated = await api.patchProfile({
        displayName: displayName || null,
        fitTags: fitTags.split(',').map((t) => t.trim()).filter(Boolean),
        styleDirection: styleDirection || null,
        activePaletteId: activePaletteId || null,
      });
      setProfile(updated); setStatus('Profile saved.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
  }
  async function exportData() {
    try {
      const blob = await api.exportData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'closet-export.zip'; link.click();
      URL.revokeObjectURL(url); setStatus('Export downloaded.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed.'); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">Settings</h1>
        {status && <p className="mt-2 text-sm">{status}</p>}
        <ErrorText message={error} />
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Display name"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></Field>
          <Field label="Fit tags (comma separated, for example structured shoulder, relaxed body, fitted sleeve)"><Input value={fitTags} onChange={(e) => setFitTags(e.target.value)} /></Field>
          <Field label="Style direction"><Input value={styleDirection} onChange={(e) => setStyleDirection(e.target.value)} placeholder="Deep Winter Softboy with structure" /></Field>
          <Field label="Active palette"><Select value={activePaletteId || 'none'} onValueChange={(v) => setActivePaletteId(v === 'none' ? '' : (v ?? ''))}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">None</SelectItem>{palettes.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select></Field>
          <p className="text-sm text-slate-600">Build, fit, and sizes are stored as fit tags and style direction on your profile, per the frozen profile API. Edit the tags above to change how the builder treats your fit.</p>
          <Button onClick={saveProfile}>Save profile</Button>
        </div>
      </Card>
      <Card>
        <h2 className="font-bold">Install app (PWA)</h2>
        <div className="mt-2"><PwaInstall /></div>
      </Card>
      <Card>
        <h2 className="font-bold">Palette management</h2>
        <p className="mt-1 text-sm text-slate-600">Upload, correct, activate, and version palettes.</p>
        <Link href="/palette" className="mt-2 inline-block"><Button>Manage palettes</Button></Link>
      </Card>
      <Card>
        <h2 className="font-bold">Data export</h2>
        <p className="mt-1 text-sm text-slate-600">Export all data, including photos, palette, items, rules, outfits, and wear logs, as a ZIP file. Export before a long period away from the app.</p>
        <Button className="mt-2" onClick={exportData}>Export data (ZIP)</Button>
      </Card>
      <Card>
        <h2 className="font-bold">Storage usage</h2>
        <p className="mt-1 text-sm">Estimated usage: {photoCount} photos at about 200KB each, about {Math.round(estimatedBytes / 1024)}KB of the 1GB Supabase free tier ({percent} percent).</p>
        {percent >= 80 && <p role="alert" className="mt-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">Warning: storage usage is at or above 80 percent of the free tier limit. Export data and consider the migration options in spec 16.5.</p>}
        {percent < 80 && <p className="mt-2 text-sm text-slate-600">Usage is below the 80 percent warning level. Note: this is an estimate from item photos, because the frozen API does not expose a storage usage endpoint.</p>}
      </Card>
      <Card>
        <h2 className="font-bold">Delete account</h2>
        {!confirmDelete && <Button variant="outline" className="mt-2" onClick={() => setConfirmDelete(true)}>Delete account</Button>}
        {confirmDelete && (
          <div className="mt-2">
            <p className="text-sm text-red-800">Are you sure? This would delete all your data, including photos, palette, items, rules, outfits, and wear logs. This cannot be undone.</p>
            <div className="mt-2 flex gap-2">
              <Button onClick={() => { setError('Account deletion is blocked: the frozen API has no account delete endpoint. This has been reported to Agent D for routing to Agent B. Your data has not been deleted. Export your data first if you want a copy, then sign out.'); setConfirmDelete(false); }}>Confirm delete</Button>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          </div>
        )}
        <div className="mt-3"><Button variant="outline" onClick={async () => { await signOut(); window.location.href = '/sign-in'; }}>Sign out</Button></div>
      </Card>
    </div>
  );
}
