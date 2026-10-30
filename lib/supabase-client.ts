// Supabase Auth client, browser only (refs ISSUE-20).
// Only the auth session uses Supabase directly. All wardrobe data goes through the frozen API.
// Placeholders from .env.example are treated as not configured. No real credentials here.
// No em dashes are used in this file.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabaseConfigured = Boolean(
  url && anonKey && !url.includes('your-project') && anonKey !== 'your-anon-key-here',
);
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anonKey)
  : null;
