// PWA install prompt and offline limitation notice (refs ISSUE-27).
// Registers the service worker, captures the beforeinstallprompt event,
// and shows an install button on Android when the browser offers it.
// No em dashes are used in this file.
'use client';
import { useEffect, useState } from 'react';
import { Button } from './ui';

export default function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<unknown>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support unavailable */ });
    }
    const handler = (event: Event) => { event.preventDefault(); setPromptEvent(event); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (installed) return <p className="text-sm text-slate-600">Closet is installed.</p>;
  if (!promptEvent) {
    return <p className="text-sm text-slate-600">To install on Android, open this app in Chrome, tap the browser menu, and choose Add to Home screen. Saved outfits and the wardrobe grid are viewable offline after first load. Offline outfit generation is supported only from your last loaded wardrobe; if no wardrobe is cached, connect once to load it. This app is not published on the Play Store in MVP.</p>;
  }
  return (
    <div className="flex items-center gap-2">
      <Button onClick={async () => { const event = promptEvent as { prompt: () => Promise<void> }; await event.prompt(); setPromptEvent(null); }}>Install Closet</Button>
      <Button variant="outline" onClick={() => setPromptEvent(null)}>Not now</Button>
    </div>
  );
}
