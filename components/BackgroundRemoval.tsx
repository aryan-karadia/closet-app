// Background removal confirm flow (refs ISSUE-09, spec section 5.1).
// The user sees a cutout and can confirm it or retake the photo. If
// background removal fails, the user can save manually, with the score
// marked manual, not auto rated. Colour clustering uses garment pixels only.
// No em dashes are used in this file.
'use client';
import { useRef, useState } from 'react';
import { Button, Card, ErrorText } from './ui';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const clusterLib = require('../lib/colour-cluster.js');

export interface PhotoResult {
  originalUrl: string;
  cutoutUrl: string | null;
  dominantColours: { hex: string; labL: number; labA: number; labB: number; percentage: number; isPrimary: boolean }[];
  backgroundRemoved: boolean;
  manual: boolean;
  file: File;
}

export default function BackgroundRemoval({ file, onConfirm, onRetake }: {
  file: File;
  onConfirm: (result: PhotoResult) => void;
  onRetake: () => void;
}) {
  const [originalUrl] = useState(() => URL.createObjectURL(file));
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [dominant, setDominant] = useState<PhotoResult['dominantColours']>([]);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);

  async function process() {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Could not load photo.')); img.src = originalUrl; });
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available.');
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: { r: number; g: number; b: number }[] = [];
      for (let i = 0; i < imageData.data.length; i += 4) pixels.push({ r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] });
      const result = clusterLib.backgroundMask(pixels, width, height, 20);
      if (!result) { setFailed(true); return; }
      const out = ctx.createImageData(width, height);
      const garmentPixels: { r: number; g: number; b: number }[] = [];
      for (let i = 0; i < pixels.length; i += 1) {
        const alpha = result.mask[i] ? 255 : 0;
        out.data[i * 4] = imageData.data[i * 4]; out.data[i * 4 + 1] = imageData.data[i * 4 + 1];
        out.data[i * 4 + 2] = imageData.data[i * 4 + 2]; out.data[i * 4 + 3] = alpha;
        if (result.mask[i]) garmentPixels.push(pixels[i]);
      }
      ctx.putImageData(out, 0, 0);
      const url = canvas.toDataURL('image/png');
      setCutoutUrl(url);
      // Sample garment pixels only, at most 4000, for clustering.
      const step = Math.max(1, Math.floor(garmentPixels.length / 4000));
      const sampled = garmentPixels.filter((_, i) => i % step === 0);
      setDominant(clusterLib.dominantColours(sampled, 4));
    } catch (e) { setError(e instanceof Error ? e.message : 'Background removal failed.'); setFailed(true); }
  }

  // Start processing on first render of this component.
  if (!doneRef.current && typeof window !== 'undefined') { void process(); }

  return (
    <Card>
      <h2 className="font-bold">Check the cutout</h2>
      <p className="mt-1 text-sm text-slate-600">One item per photo. Photos of piles or full closets are not supported for rating.</p>
      <div className="mt-3 flex gap-3">
        <div><p className="text-sm font-medium">Original</p><img src={originalUrl} alt="Original photo" className="mt-1 max-h-64 rounded border" /></div>
        {cutoutUrl && <div><p className="text-sm font-medium">Cutout (garment only)</p><img src={cutoutUrl} alt="Background removed cutout" className="mt-1 max-h-64 rounded border bg-[repeating-conic-gradient(#ddd_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]" /></div>}
      </div>
      {dominant.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="font-medium">Dominant colours (garment pixels only, k equals 4)</p>
          <ul className="mt-1 flex gap-2">
            {dominant.map((c) => <li key={c.hex} className="flex items-center gap-1"><span className="inline-block h-5 w-5 rounded border" style={{ background: c.hex }} />{c.hex} {c.percentage}%</li>)}
          </ul>
        </div>
      )}
      <ErrorText message={error} />
      {failed && <p className="mt-2 text-sm text-amber-900">Background removal failed for this photo. You can still save the item manually, but its score will be marked manual, not auto rated, until a better photo is provided. Try retaking in daylight against a plain wall.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={onRetake}>Retake photo</Button>
        {cutoutUrl && <Button onClick={() => onConfirm({ originalUrl, cutoutUrl, dominantColours: dominant, backgroundRemoved: true, manual: false, file })}>Confirm cutout</Button>}
        {failed && <Button onClick={() => onConfirm({ originalUrl, cutoutUrl: null, dominantColours: [], backgroundRemoved: false, manual: true, file })}>Save manually</Button>}
      </div>
    </Card>
  );
}
