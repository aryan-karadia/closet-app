// StorageProvider abstraction (refs ISSUE-25, spec section 16.4).
// Interface: upload(path, file) and getSignedUrl(path).
// No wardrobe, builder, or UI code may call Supabase Storage or S3 directly
// outside this provider. A future R2 or MinIO implementation only needs to
// implement this interface and change configuration.
// Bucket is private in every implementation. There is no public bucket and
// no public URL. Signed URLs are short lived.
// This file is plain JavaScript with JSDoc types so it is importable from
// both Node (require) and TypeScript (see index.d.ts). No em dashes used.
'use strict';

const crypto = require('node:crypto');

const DEFAULT_BUCKET = 'closet-images';
const DEFAULT_EXPIRES_SECONDS = 3600;

function storageError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validatePath(path) {
  if (typeof path !== 'string' || path.length === 0) {
    throw storageError('VALIDATION_ERROR', 'Storage path is required.');
  }
  if (path.startsWith('/') || path.includes('..') || path.includes('\\')) {
    throw storageError('VALIDATION_ERROR', 'Storage path is invalid.');
  }
  return path;
}

/**
 * In memory StorageProvider for local development and tests.
 * Signed URLs point at the local route GET /api/storage/<path>?token=...
 * and are only valid while this process runs. They are not public URLs.
 */
class MemoryStorageProvider {
  constructor() {
    this.files = new Map();
    this.tokens = new Map();
  }

  async upload(path, file) {
    validatePath(path);
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file || '');
    this.files.set(path, buffer);
    return { path, size: buffer.length };
  }

  async getSignedUrl(path, expiresInSeconds) {
    validatePath(path);
    if (!this.files.has(path)) {
      throw storageError('NOT_FOUND', 'Stored file does not exist.');
    }
    const seconds = expiresInSeconds || DEFAULT_EXPIRES_SECONDS;
    const expiresAt = new Date(Date.now() + seconds * 1000);
    const token = crypto.randomBytes(24).toString('hex');
    this.tokens.set(token, { path, expiresAt: expiresAt.getTime() });
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    return {
      path,
      signedUrl: '/api/storage/' + encoded + '?token=' + token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // Local only extension, used by the dev server to serve a signed URL.
  // Returns true only for a token issued by this provider that has not expired.
  verifyToken(path, token) {
    const record = this.tokens.get(token);
    if (!record || record.path !== path) return false;
    if (Date.now() > record.expiresAt) return false;
    return true;
  }

  // Local only extension, used by the dev server and by data export.
  getFile(path) {
    return this.files.get(path) || null;
  }

  hasFile(path) {
    return this.files.has(path);
  }
}

/**
 * Supabase Storage implementation, using the Supabase Storage REST API
 * directly with fetch, so no extra dependency is required. The service role
 * key is server only and must never appear in client code. The bucket is
 * private; getSignedUrl returns a Supabase signed URL, never a public URL.
 */
class SupabaseStorageProvider {
  constructor(options) {
    const opts = options || {};
    this.url = (opts.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    this.serviceRoleKey = opts.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.bucket = opts.bucket || process.env.CLOSET_STORAGE_BUCKET || DEFAULT_BUCKET;
    if (!this.url || !this.serviceRoleKey) {
      throw storageError('CONFIG_ERROR', 'Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or use the memory provider for local development.');
    }
  }

  async upload(path, file) {
    validatePath(path);
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file || '');
    const response = await fetch(
      this.url + '/storage/v1/object/' + this.bucket + '/' + path.split('/').map(encodeURIComponent).join('/'),
      {
        method: 'PUT',
        headers: {
          apikey: this.serviceRoleKey,
          Authorization: 'Bearer ' + this.serviceRoleKey,
          'Content-Type': 'image/webp',
          'x-upsert': 'true',
        },
        body: buffer,
      },
    );
    if (!response.ok) {
      throw storageError('STORAGE_ERROR', 'Supabase Storage upload failed.');
    }
    return { path, size: buffer.length };
  }

  async getSignedUrl(path, expiresInSeconds) {
    validatePath(path);
    const seconds = expiresInSeconds || DEFAULT_EXPIRES_SECONDS;
    const response = await fetch(
      this.url + '/storage/v1/object/sign/' + this.bucket + '/' + path.split('/').map(encodeURIComponent).join('/'),
      {
        method: 'POST',
        headers: {
          apikey: this.serviceRoleKey,
          Authorization: 'Bearer ' + this.serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: seconds }),
      },
    );
    if (response.status === 404) {
      throw storageError('NOT_FOUND', 'Stored file does not exist.');
    }
    if (!response.ok) {
      throw storageError('STORAGE_ERROR', 'Supabase Storage signed URL failed.');
    }
    const data = await response.json();
    const expiresAt = new Date(Date.now() + seconds * 1000);
    return {
      path,
      signedUrl: this.url + (data.signedURL || ''),
      expiresAt: expiresAt.toISOString(),
    };
  }
}

let singleton = null;

function createStorageProvider(options) {
  const opts = options || {};
  if (opts.kind === 'memory') return new MemoryStorageProvider();
  if (opts.kind === 'supabase') return new SupabaseStorageProvider(opts);
  return new MemoryStorageProvider();
}

function getStorageProvider() {
  if (singleton) return singleton;
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const forceMemory = process.env.CLOSET_FORCE_MEMORY_STORAGE === '1';
  if (hasSupabase && !forceMemory) {
    try {
      singleton = new SupabaseStorageProvider();
    } catch (error) {
      singleton = new MemoryStorageProvider();
    }
  } else {
    singleton = new MemoryStorageProvider();
  }
  return singleton;
}

function resetStorageProvider() {
  singleton = null;
}

module.exports = {
  MemoryStorageProvider,
  SupabaseStorageProvider,
  createStorageProvider,
  getStorageProvider,
  resetStorageProvider,
  DEFAULT_BUCKET,
  DEFAULT_EXPIRES_SECONDS,
};
