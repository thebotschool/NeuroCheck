// api/reset-dev-token.ts
export const config = { runtime: 'edge' };

const J = (d:any,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json'}});

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return J({ error:'method_not_allowed' }, 405);

    // body may be empty
    let body:any=null; try { body = await req.json(); } catch {}

    const DEV_BYPASS_TOKEN = (process.env.VITE_DEV_BYPASS_TOKEN ?? 'dev-token-123').toString();
    const token = (body?.token ?? DEV_BYPASS_TOKEN).toString().trim();

    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production';
    const isNonProd = env !== 'production';
    const BYPASS_ENABLED = process.env.VITE_DEV_BYPASS_ENABLED === 'true';
    const allowed = (isNonProd && BYPASS_ENABLED) || (BYPASS_ENABLED && token === DEV_BYPASS_TOKEN);
    if (!allowed) return J({ error:'forbidden', env, BYPASS_ENABLED, token, DEV_BYPASS_TOKEN }, 403);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return J({ error:'server_misconfig', SUPABASE_URL:!!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY:!!SERVICE_KEY }, 500);
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
      if (!r.ok) return J({ ok:false, step:'upsert', status:r.status, body: await r.text().catch(()=>'(no text)') }, 500);
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
    let patched:any=null; try { patched = JSON.parse(patchedText); } catch {}
    if (!patch.ok) return J({ ok:false, step:'patch', status:patch.status, body:patchedText }, 500);

    // Re-select for proof
    const reSel = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=id,token,used,is_completed,current_step,completed_at,expires_at`, {
      headers:{ apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, Prefer:'return=representation' }
    });
    const after = await reSel.json();

    return J({ ok:true, token, after });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return J({ ok:false, error:`reset-dev-token failed: ${msg}` }, 500);
  }
}