// Web Worker wrapper for the outfit engine (refs ISSUE-16, spec section 16.6).
// The worker runs buildOutfits off the main thread so the UI does not freeze.
// Message shape: { input: BuildInput }. Reply shape: { outfits: EngineOutfit[] }.
// No em dashes are used in this file.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const engine = require('./index.js');

self.onmessage = (event: MessageEvent) => {
  try {
    const outfits = engine.buildOutfits(event.data.input);
    self.postMessage({ outfits });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Outfit build failed.' });
  }
};
export {};
