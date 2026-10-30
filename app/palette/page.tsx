// Palette page: list palettes, upload a PDF and extract text (refs ISSUE-03).
// Extraction runs in the browser with pdf.js. Beauty sections are flagged
// and are never saved as clothing colours unless the user explicitly adds
// them on the correction screen. Nothing is final until the user saves there.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '../../lib/auth';
import { api } from '../../lib/api-client';
import type { Palette } from '../../lib/types';
import { Button, Card, ErrorText, Input } from '../../components/ui';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ingester = require('../../lib/palette-ingester.js');

export default function PalettePage() {
  const { user, loading } = useRequireAuth();
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [fileName, setFileName] = useState('');
  const [extracted, setExtracted] = useState<unknown[] | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user) api.listPalettes().then((r) => setPalettes(r.data)).catch(() => {}); }, [user]);
  if (loading || !user) return <p>Loading...</p>;

  async function handleFile(file: File) {
    setError(null); setStatus('Extracting text from PDF...');
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      const data = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data }).promise;
      const pages: { page: number; text: string }[] = [];
      for (let i = 1; i <= doc.numPages; i += 1) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: unknown) => (item as { str?: string }).str || '').join('\n');
        pages.push({ page: i, text });
      }
      const found = ingester.extractFromPages(pages) as unknown[];
      setExtracted(found);
      setFileName(file.name);
      setStatus('Extracted ' + found.length + ' entries. Beauty entries are flagged and will not be saved unless you add them explicitly.');
      try { window.sessionStorage.setItem('closet_palette_draft', JSON.stringify({ fileName: file.name, colours: found })); } catch { /* storage unavailable, correction page will show a note */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF extraction failed. Try a text based PDF, or add colours manually on the correction screen.');
      setStatus('');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-xl font-bold">Palette</h1>
        <p className="mt-1 text-sm text-slate-600">Upload a palette PDF. Text is extracted in the browser with pdf.js, classified into core, neutral, avoid, and ignore, and beauty sections (makeup, blush, lip, hair, nail, Facetune) are ignored.</p>
        <div className="mt-3">
          <Input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {status && <p className="mt-2 text-sm">{status}</p>}
        <ErrorText message={error} />
        {extracted && (
          <div className="mt-3">
            <ul className="list-disc pl-5 text-sm">
              {(extracted as { name: string; role: string; sourcePage: number; beauty: boolean }[]).map((c, i) => (
                <li key={i}>{c.name} ({c.role}, page {c.sourcePage}){c.beauty ? ' [beauty, ignored]' : ''}</li>
              ))}
            </ul>
            <Link href="/palette/correct" className="mt-3 inline-block"><Button>Continue to correction</Button></Link>
          </div>
        )}
      </Card>
      <Card>
        <h2 className="font-bold">Saved palettes</h2>
        {palettes.length === 0 && <p className="text-sm text-slate-600">No palettes saved yet.</p>}
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {palettes.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span>{p.name} (v{p.version}){p.isActive ? ' [active]' : ''}</span>
              {!p.isActive && <Button onClick={async () => { await api.activatePalette(p.id); const r = await api.listPalettes(); setPalettes(r.data); }}>Activate</Button>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
