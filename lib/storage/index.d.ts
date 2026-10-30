// Type declarations for lib/storage/index.js (refs ISSUE-25).
export interface SignedUrlResult {
  path: string;
  signedUrl: string;
  expiresAt: string;
}
export interface UploadResult {
  path: string;
  size: number;
}
export interface StorageProvider {
  upload(path: string, file: Buffer | Uint8Array | string): Promise<UploadResult>;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<SignedUrlResult>;
}
export class MemoryStorageProvider implements StorageProvider {
  upload(path: string, file: Buffer | Uint8Array | string): Promise<UploadResult>;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<SignedUrlResult>;
  verifyToken(path: string, token: string): boolean;
  getFile(path: string): Buffer | null;
  hasFile(path: string): boolean;
}
export class SupabaseStorageProvider implements StorageProvider {
  constructor(options?: { url?: string; serviceRoleKey?: string; bucket?: string });
  upload(path: string, file: Buffer | Uint8Array | string): Promise<UploadResult>;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<SignedUrlResult>;
}
export function createStorageProvider(options?: { kind?: 'memory' | 'supabase'; url?: string; serviceRoleKey?: string; bucket?: string }): StorageProvider;
export function getStorageProvider(): StorageProvider;
export function resetStorageProvider(): void;
export const DEFAULT_BUCKET: string;
export const DEFAULT_EXPIRES_SECONDS: number;
