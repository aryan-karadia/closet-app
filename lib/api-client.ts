// Frozen API client (refs ISSUE-20). Consumes only docs/api-contract.md endpoints.
// No Supabase Postgres or Storage access for data here, except the auth session.
// No em dashes are used in this file.
import type { AdviceRule, AvoidRule, Item, Outfit, Paginated, Palette, PaletteColor, Profile, WearLog } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_CLOSET_API_BASE || '';
export const TOKEN_KEY = 'closet_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiRequestError extends Error {
  status: number; code: string; details?: Record<string, string>;
  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message); this.status = status; this.code = code; this.details = details;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!res.ok) {
    const err = body as { error?: { code?: string; message?: string; details?: Record<string, string> } } | null;
    throw new ApiRequestError(res.status, err?.error?.code || 'INTERNAL_ERROR', err?.error?.message || ('Request failed: ' + res.status), err?.error?.details);
  }
  return body as T;
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const api = {
  session: () => apiFetch<{ user: { id: string; email: string | null } }>('/api/auth/session'),
  getProfile: () => apiFetch<Profile>('/api/profile'),
  patchProfile: (body: Partial<Profile>) => apiFetch<Profile>('/api/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  listPalettes: (params: Record<string, string | number | boolean | undefined> = {}) => apiFetch<Paginated<Palette>>('/api/palettes' + qs(params)),
  createPalette: (body: { name: string; sourceFileName?: string | null; isActive?: boolean }) => apiFetch<Palette>('/api/palettes', { method: 'POST', body: JSON.stringify(body) }),
  getPalette: (id: string) => apiFetch<Palette>('/api/palettes/' + id),
  patchPalette: (id: string, body: Partial<Palette>) => apiFetch<Palette>('/api/palettes/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePalette: (id: string) => apiFetch<{ deleted: boolean; id: string }>('/api/palettes/' + id, { method: 'DELETE' }),
  activatePalette: (id: string) => apiFetch<Palette>('/api/palettes/' + id + '/activate', { method: 'POST' }),
  versionPalette: (id: string, body: { activate?: boolean; name?: string } = {}) => apiFetch<Palette>('/api/palettes/' + id + '/versions', { method: 'POST', body: JSON.stringify(body) }),
  reratePalette: (id: string) => apiFetch<{ paletteId: string; reratedCount: number; skippedCount: number; totalCount: number }>('/api/palettes/' + id + '/rerate', { method: 'POST' }),

  listPaletteColours: (paletteId: string, params: Record<string, string | number | undefined> = {}) => apiFetch<Paginated<PaletteColor>>('/api/palettes/' + paletteId + '/colours' + qs(params)),
  createPaletteColour: (paletteId: string, body: Record<string, unknown>) => apiFetch<PaletteColor>('/api/palettes/' + paletteId + '/colours', { method: 'POST', body: JSON.stringify(body) }),
  patchPaletteColour: (paletteId: string, colourId: string, body: Partial<PaletteColor>) => apiFetch<PaletteColor>('/api/palettes/' + paletteId + '/colours/' + colourId, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePaletteColour: (paletteId: string, colourId: string) => apiFetch<{ deleted: boolean; id: string }>('/api/palettes/' + paletteId + '/colours/' + colourId, { method: 'DELETE' }),

  listAvoidRules: (paletteId: string) => apiFetch<Paginated<AvoidRule>>('/api/palettes/' + paletteId + '/avoid-rules'),
  createAvoidRule: (paletteId: string, body: Partial<AvoidRule> & { name: string }) => apiFetch<AvoidRule>('/api/palettes/' + paletteId + '/avoid-rules', { method: 'POST', body: JSON.stringify(body) }),
  deleteAvoidRule: (paletteId: string, ruleId: string) => apiFetch<{ deleted: boolean; id: string }>('/api/palettes/' + paletteId + '/avoid-rules/' + ruleId, { method: 'DELETE' }),

  listItems: (params: Record<string, string | number | undefined> = {}) => apiFetch<Paginated<Item>>('/api/items' + qs(params)),
  createItem: (body: Record<string, unknown>) => apiFetch<Item>('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  getItem: (id: string) => apiFetch<Item>('/api/items/' + id),
  patchItem: (id: string, body: Record<string, unknown>) => apiFetch<Item>('/api/items/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteItem: (id: string) => apiFetch<{ deleted: boolean; id: string; softDeleted: boolean }>('/api/items/' + id, { method: 'DELETE' }),
  restoreItem: (id: string) => apiFetch<Item>('/api/items/' + id + '/restore', { method: 'POST' }),
  permanentDeleteItem: (id: string) => apiFetch<{ deleted: boolean; id: string; softDeleted: boolean }>('/api/items/' + id + '/permanent-delete', { method: 'POST' }),
  replaceItemColours: (id: string, colours: { hex: string; percentage: number; isPrimary?: boolean }[]) => apiFetch<Paginated<unknown>>('/api/items/' + id + '/colours', { method: 'POST', body: JSON.stringify({ colours }) }),

  upload: (body: Record<string, unknown>) => apiFetch<{ path: string; kind: string; contentType: string; size: number; signedUrl: string; expiresAt: string }>('/api/uploads', { method: 'POST', body: JSON.stringify(body) }),

  listOutfits: (params: Record<string, string | boolean | number | undefined> = {}) => apiFetch<Paginated<Outfit>>('/api/outfits' + qs(params)),
  createOutfit: (body: Record<string, unknown>) => apiFetch<Outfit>('/api/outfits', { method: 'POST', body: JSON.stringify(body) }),
  getOutfit: (id: string) => apiFetch<Outfit>('/api/outfits/' + id),
  patchOutfit: (id: string, body: Record<string, unknown>) => apiFetch<Outfit>('/api/outfits/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteOutfit: (id: string) => apiFetch<{ deleted: boolean; id: string }>('/api/outfits/' + id, { method: 'DELETE' }),

  listWearLogs: (params: Record<string, string | undefined> = {}) => apiFetch<Paginated<WearLog>>('/api/wear-logs' + qs(params)),
  createWearLog: (body: { outfitId: string; itemIds: string[]; wornAt?: string; occasion?: string | null; note?: string | null }) => apiFetch<WearLog>('/api/wear-logs', { method: 'POST', body: JSON.stringify(body) }),

  listAdviceRules: (params: Record<string, string | boolean | undefined> = {}) => apiFetch<Paginated<AdviceRule>>('/api/advice-rules' + qs(params)),
  seedAdviceRules: () => apiFetch<{ seeded: boolean; data: AdviceRule[] }>('/api/advice-rules/seed', { method: 'POST' }),
  createAdviceRule: (body: Partial<AdviceRule> & { name: string; action: string; reason: string; source: string }) => apiFetch<AdviceRule>('/api/advice-rules', { method: 'POST', body: JSON.stringify(body) }),
  patchAdviceRule: (id: string, body: Partial<AdviceRule>) => apiFetch<AdviceRule>('/api/advice-rules/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAdviceRule: (id: string) => apiFetch<{ deleted: boolean; id: string }>('/api/advice-rules/' + id, { method: 'DELETE' }),

  exportData: async (): Promise<Blob> => {
    const token = getToken();
    const res = await fetch(API_BASE + '/api/export', { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {} });
    if (!res.ok) throw new ApiRequestError(res.status, 'INTERNAL_ERROR', 'Export failed: ' + res.status);
    return res.blob();
  },
};
