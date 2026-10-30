// Repository interface (refs ISSUE-21).
// Handlers never talk to Supabase directly. They use this generic interface:
//   db.list(collection, userId), db.get(collection, id),
//   db.insert(collection, record), db.update(collection, id, patch),
//   db.delete(collection, id)
// Collections: profiles, palettes, paletteColours, avoidRules, items,
// itemColours, outfits, outfitItems, wearLogs, adviceRules.
// The default implementation is in memory, so local development and tests
// work with no credentials. When Supabase variables are present, the
// PostgREST implementation is used instead. The Supabase implementation has
// not been exercised against a live project in this task (see the ISSUE-21
// PR file), and must be confirmed against a real project before production.
// API camelCase fields are translated to snake_case columns and back.
// No em dashes are used in this file.
'use strict';

const storeModule = require('../api/store');

const TABLE_NAMES = {
  profiles: 'profiles',
  palettes: 'palettes',
  paletteColours: 'palette_colors',
  avoidRules: 'avoid_rules',
  items: 'items',
  itemColours: 'item_colors',
  outfits: 'outfits',
  outfitItems: 'outfit_items',
  wearLogs: 'wear_logs',
  adviceRules: 'advice_rules',
};

function camelToSnake(value) {
  return value.replace(/[A-Z]/g, (letter) => '_' + letter.toLowerCase());
}

function snakeToCamel(value) {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnake(record) {
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    out[camelToSnake(key)] = value;
  }
  return out;
}

function toCamel(record) {
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    out[snakeToCamel(key)] = value;
  }
  return out;
}

class MemoryRepository {
  constructor(store) {
    this.store = store || storeModule.getStore();
  }

  list(collection, userId) {
    const map = this.store[collection];
    const all = Array.from(map.values());
    if (userId === undefined) return all.map((item) => ({ ...item }));
    return all.filter((item) => item.userId === userId).map((item) => ({ ...item }));
  }

  get(collection, id) {
    const record = this.store[collection].get(id);
    return record ? { ...record } : null;
  }

  insert(collection, record) {
    this.store[collection].set(record.id, { ...record });
    return { ...record };
  }

  update(collection, id, patch) {
    const existing = this.store[collection].get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.store[collection].set(id, updated);
    return { ...updated };
  }

  delete(collection, id) {
    return this.store[collection].delete(id);
  }
}

class SupabaseRepository {
  constructor(options) {
    const opts = options || {};
    this.url = (opts.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    this.serviceRoleKey = opts.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!this.url || !this.serviceRoleKey) {
      throw new Error('Supabase repository is not configured.');
    }
  }

  async request(table, method, query, body) {
    const url = this.url + '/rest/v1/' + table + (query || '');
    const response = await fetch(url, {
      method,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: 'Bearer ' + this.serviceRoleKey,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = new Error('Supabase request failed.');
      error.code = response.status === 404 ? 'NOT_FOUND' : 'STORAGE_ERROR';
      throw error;
    }
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  async list(collection, userId) {
    const table = TABLE_NAMES[collection];
    const query = userId === undefined ? '?select=*' : '?select=*&user_id=eq.' + encodeURIComponent(userId);
    const rows = await this.request(table, 'GET', query);
    return (rows || []).map(toCamel);
  }

  async get(collection, id) {
    const table = TABLE_NAMES[collection];
    // Outfit items use a composite primary key (outfit_id, item_id). The
    // memory store keys them by "outfitId:itemId", so translate that key
    // back to the two columns for Supabase.
    if (collection === 'outfitItems' && typeof id === 'string' && id.includes(':')) {
      const [outfitId, itemId] = id.split(':');
      const rows = await this.request(table, 'GET', '?select=*&outfit_id=eq.' + encodeURIComponent(outfitId) + '&item_id=eq.' + encodeURIComponent(itemId));
      if (!rows || rows.length === 0) return null;
      return toCamel(rows[0]);
    }
    const rows = await this.request(table, 'GET', '?select=*&id=eq.' + encodeURIComponent(id));
    if (!rows || rows.length === 0) return null;
    return toCamel(rows[0]);
  }

  async insert(collection, record) {
    const table = TABLE_NAMES[collection];
    const payload = { ...record };
    // The memory key "outfitId:itemId" is not a column in Supabase.
    if (collection === 'outfitItems') delete payload.id;
    const rows = await this.request(table, 'POST', '', toSnake(payload));
    if (Array.isArray(rows) && rows.length > 0) return toCamel(rows[0]);
    return { ...record };
  }

  async update(collection, id, patch) {
    const table = TABLE_NAMES[collection];
    const rows = await this.request(table, 'PATCH', '?id=eq.' + encodeURIComponent(id), toSnake(patch));
    if (Array.isArray(rows) && rows.length > 0) return toCamel(rows[0]);
    return null;
  }

  async delete(collection, id) {
    const table = TABLE_NAMES[collection];
    if (collection === 'outfitItems' && typeof id === 'string' && id.includes(':')) {
      const [outfitId, itemId] = id.split(':');
      await this.request(table, 'DELETE', '?outfit_id=eq.' + encodeURIComponent(outfitId) + '&item_id=eq.' + encodeURIComponent(itemId));
      return true;
    }
    await this.request(table, 'DELETE', '?id=eq.' + encodeURIComponent(id));
    return true;
  }
}

let singleton = null;

function getRepository() {
  if (singleton) return singleton;
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const forceMemory = process.env.CLOSET_FORCE_MEMORY_STORAGE === '1';
  if (hasSupabase && !forceMemory) {
    try {
      singleton = new SupabaseRepository();
    } catch (error) {
      singleton = new MemoryRepository();
    }
  } else {
    singleton = new MemoryRepository();
  }
  return singleton;
}

function resetRepository() {
  singleton = null;
  storeModule.resetStore();
}

module.exports = {
  MemoryRepository,
  SupabaseRepository,
  getRepository,
  resetRepository,
  TABLE_NAMES,
  camelToSnake,
  snakeToCamel,
};
