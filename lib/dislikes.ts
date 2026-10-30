// Disliked outfit combinations, stored in browser local storage (refs ISSUE-17).
// The frozen contract has no dislike endpoint, so dislikes are local to
// this device until Agent D approves a contract addition. They still block
// the exact combination for 30 days in the browser engine.
// No em dashes are used in this file.
export const DISLIKE_KEY = 'closet_dislikes';
export interface Dislike { ids: string[]; dislikedAt: string }
export function loadDislikes(): Dislike[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(DISLIKE_KEY) || '[]'); } catch { return []; }
}
export function saveDislike(ids: string[]) {
  if (typeof window === 'undefined') return;
  const list = loadDislikes();
  list.push({ ids, dislikedAt: new Date().toISOString() });
  try { window.localStorage.setItem(DISLIKE_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
}
