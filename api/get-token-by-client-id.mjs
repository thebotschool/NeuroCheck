// api/get-token-by-client-id.mjs
import { getAdminClient } from './_lib/supabaseServer.mjs';

export const config = { runtime: 'edge' };

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return json({ error: 'clientId_required' }, 400);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('tests')
      .select('token, email')
      .eq('client_id', clientId)
      .single();

    if (error) {
      // 'PGRST116' is the code for "No rows found"
      if (error.code === 'PGRST116') {
        return json({ token: null, status: 'pending' }, 200);
      }
      console.error('Supabase select failed:', error);
      return json({ error: 'select_failed', details: error }, 500);
    }

    if (data) {
      return json({ token: data.token, email: data.email, status: 'found' }, 200);
    } else {
      return json({ token: null, status: 'pending' }, 200);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return json({ error: `get-token-by-client-id failed: ${msg}` }, 500);
  }
}