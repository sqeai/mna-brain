import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type StorageClient = SupabaseClient;

export function getSupabaseStorageClient(): StorageClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(url, key);
}
