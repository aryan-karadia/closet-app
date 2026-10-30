// Image upload and signed URL handlers (refs ISSUE-08, ISSUE-25).
// Compressed images only: the browser compresses before upload, and the
// server accepts WebP only, with image width at most 1200px and thumbnail
// width at most 400px (spec sections 9.1 and 16.4). The database stores the
// storage path only, never a public URL. Signed URLs are short lived and
// come from the StorageProvider. No em dashes are used in this file.
'use strict';

const errors = require('./errors');
const validate = require('./validate');
const { ok, created } = require('./http');
const { newId } = require('./store');
const { assertOwner } = require('./ownership');
const { getStorageProvider } = require('../storage/index');

const MAX_DECODED_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(fileName) {
  const base = String(fileName).split('/').pop().split('\\').pop();
  return base.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function createUpload(ctx) {
  const body = ctx.body || {};
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['contentType', body.contentType === undefined ? 'contentType is required.' : (body.contentType === 'image/webp' ? null : 'contentType must be image/webp. Compressed WebP only.')],
    ['kind', body.kind === undefined ? 'kind is required.' : (body.kind === 'image' || body.kind === 'thumbnail' ? null : 'kind must be image or thumbnail.')],
    ['width', validate.checkInteger(body.width, 'width', { required: true, min: 1 })],
    ['height', validate.checkInteger(body.height, 'height', { required: true, min: 1, max: 4000 })],
    ['dataBase64', body.dataBase64 === undefined || body.dataBase64 === null ? 'dataBase64 is required.' : (typeof body.dataBase64 !== 'string' || body.dataBase64.length === 0 ? 'dataBase64 must be a non empty base64 string.' : null)],
    ['itemId', body.itemId === undefined || body.itemId === null ? null : validate.checkString(body.itemId, 'itemId', {})],
    ['path', body.path === undefined || body.path === null ? null : validate.checkString(body.path, 'path', { maxLength: 500 })],
    ['fileName', body.fileName === undefined || body.fileName === null ? null : validate.checkString(body.fileName, 'fileName', { maxLength: 200 })],
  ]);
  if (details) throw errors.validationError(details);
  if (body.kind === 'image' && body.width > 1200) {
    throw errors.validationError({ width: 'Image width must be at most 1200 pixels. Compress in the browser before upload.' });
  }
  if (body.kind === 'thumbnail' && body.width > 400) {
    throw errors.validationError({ width: 'Thumbnail width must be at most 400 pixels. Compress in the browser before upload.' });
  }
  if (body.itemId) {
    const item = await ctx.db.get('items', body.itemId);
    assertOwner(item, ctx.user.id);
    if (item.deletedAt) throw errors.notFound('Resource not found.');
  }
  let path = body.path || null;
  if (path) {
    const prefix = 'items/' + ctx.user.id + '/';
    if (!path.startsWith(prefix)) throw errors.forbidden('Storage path must belong to the authenticated user.');
    if (path.includes('..')) throw errors.validationError({ path: 'Storage path is invalid.' });
  } else {
    const base = body.itemId || newId();
    let fileName = null;
    if (body.fileName) {
      fileName = sanitizeFileName(body.fileName);
      if (!fileName.toLowerCase().endsWith('.webp')) fileName += '.webp';
    } else {
      fileName = body.kind === 'thumbnail' ? base + '-thumb.webp' : base + '.webp';
    }
    path = 'items/' + ctx.user.id + '/' + fileName;
  }
  let buffer;
  try {
    buffer = Buffer.from(body.dataBase64, 'base64');
  } catch (error) {
    throw errors.validationError({ dataBase64: 'dataBase64 must be valid base64.' });
  }
  if (buffer.length === 0) throw errors.validationError({ dataBase64: 'File data must not be empty.' });
  if (buffer.length > MAX_DECODED_BYTES) throw errors.validationError({ dataBase64: 'File is too large. Maximum decoded size is 5MB.' });
  const provider = getStorageProvider();
  const uploaded = await provider.upload(path, buffer);
  const signed = await provider.getSignedUrl(path, 3600);
  return created({
    path: uploaded.path,
    kind: body.kind,
    contentType: 'image/webp',
    size: uploaded.size,
    signedUrl: signed.signedUrl,
    expiresAt: signed.expiresAt,
  });
}

async function createSignedUrl(ctx) {
  const body = ctx.body || {};
  if (!validate.isPlainObject(body)) throw errors.validationError(null, 'Request body must be a JSON object.');
  const details = validate.collectDetails([
    ['path', validate.checkRequiredString(body.path, 'path', 500)],
    ['expiresInSeconds', body.expiresInSeconds === undefined || body.expiresInSeconds === null ? null : validate.checkInteger(body.expiresInSeconds, 'expiresInSeconds', { min: 60, max: 86400 })],
  ]);
  if (details) throw errors.validationError(details);
  const prefix = 'items/' + ctx.user.id + '/';
  if (!body.path.startsWith(prefix)) throw errors.forbidden('Storage path must belong to the authenticated user.');
  const provider = getStorageProvider();
  const signed = await provider.getSignedUrl(body.path, body.expiresInSeconds || 3600);
  return ok(signed);
}

module.exports = { createUpload, createSignedUrl };
