// DB access now goes through Drizzle (see @/lib/server/db). The Supabase client
// is kept only for Storage operations — use @/lib/server/supabase-storage.
export { getSupabaseStorageClient, type StorageClient } from './supabase-storage';
