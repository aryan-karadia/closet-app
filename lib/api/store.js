// In memory repository for local development and tests (refs ISSUE-21).
// The API handlers use this store through a small interface, not through a
// live Supabase project, so the dev server works with no credentials.
// When Supabase environment variables are present, the Supabase repository
// in lib/data/supabase-repository.js is used instead (see that file for the
// PostgREST implementation). The memory store is the default when no
// Supabase variables are set. No em dashes are used in this file.
'use strict';

const crypto = require('node:crypto');

function newId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function createStore() {
  return {
    profiles: new Map(),
    palettes: new Map(),
    paletteColours: new Map(),
    avoidRules: new Map(),
    items: new Map(),
    itemColours: new Map(),
    outfits: new Map(),
    outfitItems: new Map(),
    wearLogs: new Map(),
    adviceRules: new Map(),
  };
}

let singleton = null;

function getStore() {
  if (!singleton) singleton = createStore();
  return singleton;
}

function resetStore() {
  singleton = createStore();
  return singleton;
}

module.exports = { createStore, getStore, resetStore, newId, now };
