export const config = { runtime: "nodejs" };

// api/get-token-by-client-id.mjs
import { getAdminClient } from './_lib/supabaseServer.mjs';

export default async function handler(req, res) {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId_required' });
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
        return res.status(200).json({ token: null, status: 'pending' });
      }
      console.error('Supabase select failed:', error);
      return res.status(500).json({ error: 'select_failed', details: error });
    }

    if (data) {
      return res.status(200).json({ token: data.token, email: data.email, status: 'found' });
    } else {
      return res.status(200).json({ token: null, status: 'pending' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return res.status(500).json({ error: `get-token-by-client-id failed: ${msg}` });
  }
}