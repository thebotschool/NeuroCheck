export const config = { runtime: "nodejs" };

// api/reset-dev-token.mjs
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });

    // body may be empty
    const body = req.body;

    const DEV_BYPASS_TOKEN = (process.env.VITE_DEV_BYPASS_TOKEN ?? 'dev-token-123').toString();
    const token = (body?.token ?? DEV_BYPASS_TOKEN).toString().trim();

    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production';
    const isNonProd = env !== 'production';
    const BYPASS_ENABLED = process.env.VITE_DEV_BYPASS_ENABLED === 'true';
    const allowed = (isNonProd && BYPASS_ENABLED) || (BYPASS_ENABLED && token === DEV_BYPASS_TOKEN);
    if (!allowed) return res.status(403).json({ error:'forbidden', env, BYPASS_ENABLED, token, DEV_BYPASS_TOKEN });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error:'server_misconfig', SUPABASE_URL:!!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY:!!SERVICE_KEY });
    }

    // Ensure row exists (UPSERT by unique token)
    {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/tests`, {
        method:'POST',
        headers:{
          apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`,
          'Content-Type':'application/json',
          Prefer:'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          token, payment_id:'dev-payment', age:10, email:'dev@example.com',
          used:false, is_completed:false, current_step:1,
          started_at: new Date().toISOString(),
          completed_at: null,
          expires_at: new Date(Date.now()+90*24*3600*1000).toISOString(),
          cpt_results:null, gonogo_results:null, memory_results:null
        })
      });
      if (!r.ok) return res.status(500).json({ ok:false, step:'upsert', status:r.status, body: await r.text().catch(()=>'(no text)') });
    }

    // Reset flags
    const patch = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}`, {
      method:'PATCH',
      headers:{
        apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`,
        'Content-Type':'application/json',
        Prefer:'return=representation'
      },
      body: JSON.stringify({
        used:false,
        is_completed:false,
        current_step:1,
        completed_at:null,
        cpt_results:null,
        gonogo_results:null,
        memory_results:null,
        expires_at: new Date(Date.now()+90*24*3600*1000).toISOString()
      })
    });
    const patchedText = await patch.text().catch(()=>'(no text)');
    if (!patch.ok) return res.status(500).json({ ok:false, step:'patch', status:patch.status, body:patchedText });

    // Re-select for proof
    const reSel = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=id,token,used,is_completed,current_step,completed_at,expires_at`, {
      headers:{ apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, Prefer:'return=representation' }
    });
    const after = await reSel.json();

    return res.status(200).json({ ok:true, token, after });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return res.status(500).json({ ok:false, error:`reset-dev-token failed: ${msg}` });
  }
}