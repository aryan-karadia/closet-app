// Item add page (refs ISSUE-11, ISSUE-09, spec sections 5.1 and 7).
// Photo, background removal confirm, dominant colours, server rating
// against the active palette, then save. Manual saves have no auto score.
// No em dashes are used in this file.
'use client';
import { useState } from 'react';
import { useRequireAuth } from '../../../lib/auth';
import { api } from '../../../lib/api-client';
import { compressImage, blobToBase64 } from '../../../lib/image-compress';
import BackgroundRemoval, { type PhotoResult } from '../../../components/BackgroundRemoval';
import { Button, Card, ErrorText, Field, Input, Select, SecondaryButton } from '../../../components/ui';
import { CATEGORIES, SEASONS } from '../../../lib/types';

export default function NewItemPage() {
  const { user, loading } = useRequireAuth();
  const [file, setFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<PhotoResult | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('sweater');
  const [season, setSeason] = useState('all-season');
  const [fitTags, setFitTags] = useState('');
  const [status, setStatus] = useState('in rotation');
  const [price, setPrice] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (loading || !user) return <p>Loading...</p>;

  async function save() {
    if (!name.trim()) { setError('A name is required.'); return; }
    setError(null); setProgress('Saving item...');
    try {
      const colours = photo && !photo.manual ? photo.dominantColours.map((c) => ({ hex: c.hex, labL: c.labL, labA: c.labA, labB: c.labB, percentage: c.percentage, isPrimary: c.isPrimary })) : undefined;
      const item = await api.createItem({
        name: name.trim(), category, season,
        fitTags: fitTags.split(',').map((t) => t.trim()).filter(Boolean),
        status, price: price ? Number(price) : null,
        primaryColorHex: photo && !photo.manual && photo.dominantColours[0] ? photo.dominantColours[0].hex : null,
        ratingReason: photo && photo.manual ? 'Manual, not auto rated. A better photo is needed for auto rating.' : null,
        colours,
      });
      if (file) {
        setProgress('Uploading compressed photo...');
        const image = await compressImage(file, 1200);
        const thumb = await compressImage(file, 400);
        const imageUpload = await api.upload({ itemId: item.id, contentType: 'image/webp', kind: 'image', width: image.width, height: image.height, dataBase64: await blobToBase64(image.blob) });
        const thumbUpload = await api.upload({ itemId: item.id, contentType: 'image/webp', kind: 'thumbnail', width: thumb.width, height: thumb.height, dataBase64: await blobToBase64(thumb.blob) });
        await api.patchItem(item.id, { photoPath: imageUpload.path, thumbnailPath: thumbUpload.path });
      }
      window.location.href = '/items/' + item.id;
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); setProgress(''); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">Add item</h1>
        {!file && <div className="mt-3"><Field label="Photo (one item per photo)"><Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} /></Field></div>}
        {file && !photo && <BackgroundRemoval file={file} onConfirm={(result) => setPhoto(result)} onRetake={() => setFile(null)} />}
        {photo && <p className="mt-2 text-sm">{photo.manual ? 'Manual save: no auto score until a better photo is provided.' : 'Cutout confirmed with ' + photo.dominantColours.length + ' dominant colours.'} <SecondaryButton onClick={() => { setPhoto(null); setFile(null); }}>Retake</SecondaryButton></p>}
      </Card>
      <Card>
        <div className="flex flex-col gap-3">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Season"><Select value={season} onChange={(e) => setSeason(e.target.value)}>{SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
          <Field label="Fit tags (comma separated)"><Input value={fitTags} onChange={(e) => setFitTags(e.target.value)} placeholder="relaxed body, structured shoulder" /></Field>
          <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="in rotation">in rotation</option><option value="stored">stored</option><option value="archived">archived</option></Select></Field>
          <Field label="Price (optional)"><Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          {progress && <p className="text-sm">{progress}</p>}
          <ErrorText message={error} />
          <Button onClick={save}>Save item</Button>
        </div>
      </Card>
    </div>
  );
}
