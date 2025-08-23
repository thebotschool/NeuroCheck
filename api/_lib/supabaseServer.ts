// api/_lib/supabaseServer.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let adminClient: SupabaseClient | null = null;
export function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Supabase admin env missing: URL=${!!url}, KEY=${!!key}`);
  if (!adminClient) adminClient = createClient(url, key, { auth:{ autoRefreshToken:false, persistSession:false } });
  return adminClient;
}