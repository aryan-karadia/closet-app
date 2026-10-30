// API router (refs ISSUE-21 and later resource issues).
// Handlers are transport agnostic: they take { method, path, query, headers,
// body } and return { status, body } or, for export, { status, zip, filename }.
// The dev server (scripts/dev-server.js) and the Next.js catch-all route
// (app/api/[...path]/route.ts) both adapt HTTP to this shape.
// Auth runs before routing for every /api path except the local signed file
// route, so an unauthenticated request returns 401 even for an unknown path.
// Ownership rule: existence is checked first, then ownership, so a resource
// owned by another user is 403 and a missing resource is 404.
// No em dashes are used in this file.
'use strict';

const { getUser } = require('./auth');
const { getRepository } = require('../data/repository');
const { getStorageProvider } = require('../storage/index');
const errors = require('./errors');
const validate = require('./validate');
const { ok, created, handleError } = require('./http');
const { newId, now } = require('./store');

function cleanPath(path) {
  let clean = path || '/';
  if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
  return clean;
}

const { assertOwner } = require('./ownership');

function assertPaletteOwner(record, userId) {
  return assertOwner(record, userId);
}

async function getProfileForUser(db, userId) {
  const existing = db.list('profiles', userId);
  if (existing.length > 0) return existing[0];
  const profile = {
    id: userId,
    userId,
    displayName: null,
    fitTags: [],
    styleDirection: null,
    activePaletteId: null,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.insert('profiles', profile);
  return profile;
}

async function handleSession(ctx) {
  return ok({ user: { id: ctx.user.id, email: ctx.user.email } });
}

async function handleGetProfile(ctx) {
  const profile = await getProfileForUser(ctx.db, ctx.user.id);
  return ok(profile);
}

async function handlePatchProfile(ctx) {
  const body = ctx.body || {};
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['displayName', body.displayName === undefined ? null : (body.displayName === null ? null : validate.checkString(body.displayName, 'displayName', { maxLength: 100, nonEmpty: true }))],
    ['fitTags', validate.checkStringArray(body.fitTags, 'fitTags', 20)],
    ['styleDirection', body.styleDirection === undefined ? null : (body.styleDirection === null ? null : validate.checkString(body.styleDirection, 'styleDirection', { maxLength: 200 }))],
    ['activePaletteId', body.activePaletteId === undefined || body.activePaletteId === null ? null : validate.checkString(body.activePaletteId, 'activePaletteId', {})],
  ]);
  if (details) throw errors.validationError(details);
  if (body.activePaletteId !== undefined && body.activePaletteId !== null) {
    const palette = await ctx.db.get('palettes', body.activePaletteId);
    if (!palette) throw errors.validationError({ activePaletteId: 'activePaletteId does not refer to an existing palette.' });
    if (palette.userId !== ctx.user.id) throw errors.forbidden('This palette belongs to another user.');
  }
  const profile = await getProfileForUser(ctx.db, ctx.user.id);
  const patch = { updatedAt: now() };
  if (body.displayName !== undefined) patch.displayName = body.displayName;
  if (body.fitTags !== undefined) patch.fitTags = body.fitTags;
  if (body.styleDirection !== undefined) patch.styleDirection = body.styleDirection;
  if (body.activePaletteId !== undefined) patch.activePaletteId = body.activePaletteId;
  const updated = await ctx.db.update('profiles', profile.id, patch);
  return ok(updated);
}

// Route table. Later resource branches add entries here in dependency order.
// Each entry: method, pattern (RegExp with named groups), handler(ctx).
// The router is extended branch by branch; see docs/prs for each branch.
const palettes = require('./palettes');
const avoidRules = require('./avoid-rules');
const items = require('./items');
const itemColourRoutes = require('./item-colour-routes');
const uploads = require('./uploads');
const routes = [
  { method: 'GET', pattern: /^\/api\/auth\/session$/, handler: handleSession },
  { method: 'GET', pattern: /^\/api\/profile$/, handler: handleGetProfile },
  { method: 'PATCH', pattern: /^\/api\/profile$/, handler: handlePatchProfile },
  { method: 'GET', pattern: /^\/api\/palettes$/, handler: palettes.listPalettes },
  { method: 'POST', pattern: /^\/api\/palettes$/, handler: palettes.createPalette },
  { method: 'GET', pattern: /^\/api\/palettes\/(?<id>[^/]+)$/, handler: palettes.getPalette },
  { method: 'PATCH', pattern: /^\/api\/palettes\/(?<id>[^/]+)$/, handler: palettes.updatePalette },
  { method: 'DELETE', pattern: /^\/api\/palettes\/(?<id>[^/]+)$/, handler: palettes.deletePalette },
  { method: 'POST', pattern: /^\/api\/palettes\/(?<id>[^/]+)\/activate$/, handler: palettes.activatePalette },
  { method: 'POST', pattern: /^\/api\/palettes\/(?<id>[^/]+)\/versions$/, handler: palettes.createPaletteVersion },
  { method: 'GET', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/colours$/, handler: palettes.listColours },
  { method: 'POST', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/colours$/, handler: palettes.createColour },
  { method: 'GET', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/colours\/(?<colourId>[^/]+)$/, handler: palettes.getColour },
  { method: 'PATCH', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/colours\/(?<colourId>[^/]+)$/, handler: palettes.updateColour },
  { method: 'DELETE', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/colours\/(?<colourId>[^/]+)$/, handler: palettes.deleteColour },
  { method: 'GET', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/avoid-rules$/, handler: avoidRules.listRules },
  { method: 'POST', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/avoid-rules$/, handler: avoidRules.createRule },
  { method: 'GET', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/avoid-rules\/(?<ruleId>[^/]+)$/, handler: avoidRules.getRule },
  { method: 'PATCH', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/avoid-rules\/(?<ruleId>[^/]+)$/, handler: avoidRules.updateRule },
  { method: 'DELETE', pattern: /^\/api\/palettes\/(?<paletteId>[^/]+)\/avoid-rules\/(?<ruleId>[^/]+)$/, handler: avoidRules.deleteRule },
  { method: 'GET', pattern: /^\/api\/items$/, handler: items.listItems },
  { method: 'POST', pattern: /^\/api\/items$/, handler: items.createItem },
  { method: 'GET', pattern: /^\/api\/items\/(?<id>[^/]+)$/, handler: items.getItem },
  { method: 'PATCH', pattern: /^\/api\/items\/(?<id>[^/]+)$/, handler: items.updateItem },
  { method: 'DELETE', pattern: /^\/api\/items\/(?<id>[^/]+)$/, handler: items.deleteItem },
  { method: 'POST', pattern: /^\/api\/items\/(?<id>[^/]+)\/restore$/, handler: items.restoreItem },
  { method: 'POST', pattern: /^\/api\/items\/(?<id>[^/]+)\/permanent-delete$/, handler: items.permanentDeleteItem },
  { method: 'GET', pattern: /^\/api\/items\/(?<itemId>[^/]+)\/colours$/, handler: itemColourRoutes.listItemColours },
  { method: 'POST', pattern: /^\/api\/items\/(?<itemId>[^/]+)\/colours$/, handler: itemColourRoutes.replaceItemColours },
  { method: 'POST', pattern: /^\/api\/uploads$/, handler: uploads.createUpload },
  { method: 'POST', pattern: /^\/api\/uploads\/signed-url$/, handler: uploads.createSignedUrl },
];

// This list is filled by resource modules as they land, branch by branch.
// Keeping the table in this file (rather than in the dev server) means the
// Next.js route adapter and the dev server always serve the same routes.
function getRoutes() {
  return routes;
}

async function handleRequest(input) {
  const path = cleanPath(input.path);
  const method = (input.method || 'GET').toUpperCase();
  const query = input.query || {};
  const headers = input.headers || {};
  try {
    // Local signed file route: token based, not bearer based.
    if (path.startsWith('/api/storage/')) {
      if (method !== 'GET') throw errors.methodNotAllowed('Only GET is allowed for stored files.');
      const storagePath = decodeURIComponent(path.slice('/api/storage/'.length));
      const provider = getStorageProvider();
      if (typeof provider.verifyToken !== 'function') {
        throw errors.notFound('Stored file route is local only. In production, signed URLs point at Supabase Storage.');
      }
      const token = query.token;
      if (!token || !provider.verifyToken(storagePath, token)) {
        throw errors.unauthenticated('A valid signed URL token is required.');
      }
      const file = provider.getFile(storagePath);
      if (!file) throw errors.notFound('Stored file does not exist.');
      return { status: 200, file, contentType: 'image/webp', fileName: storagePath.split('/').pop() };
    }

    // Auth runs before any routing or path check, so an unauthenticated
    // request returns 401 even for an unknown path (ISSUE-21 fix on the
    // ISSUE-01 branch: the previous order returned 404 for non /api paths).
    const user = await getUser(headers);
    if (!path.startsWith('/api/')) throw errors.notFound('Resource not found.');
    const db = getRepository();
    const ctx = {
      method, path, query, headers,
      body: input.body === undefined ? null : input.body,
      user, db,
    };
    for (const route of routes) {
      const match = route.pattern.exec(path);
      if (match && route.method === method) {
        ctx.params = match.groups || {};
        return await route.handler(ctx);
      }
    }
    // Path exists as a known prefix but method is wrong, versus unknown path.
    const pathMatches = routes.some((route) => route.pattern.test(path));
    if (pathMatches) throw errors.methodNotAllowed('Method not allowed for this path.');
    throw errors.notFound('Resource not found.');
  } catch (error) {
    return handleError(error);
  }
}

module.exports = {
  handleRequest,
  getRoutes,
  routes,
  assertOwner,
  assertPaletteOwner,
  getProfileForUser,
  cleanPath,
};
