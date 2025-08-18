// api/reset-dev-token.ts (DEBUG MODE)
export const config = { runtime: 'edge' };

const J = (d:any,s=200)=>new Response(JSON.stringify(d,null,2),{status:s,headers:{'content-type':'application/json'}});

export default async function handler(req: Request): Promise<Response> {
  // 0) Метод
  if (req.method !== 'POST') return J({ error:'method_not_allowed' }, 405);

  // 1) Парс тела
  let body:any=null;
  try { body = await req.json(); } catch {}
  const DEV_BYPASS_TOKEN = (process.env.VITE_DEV_BYPASS_TOKEN ?? 'dev-token-123').toString();
  const requestedToken   = (body?.token ?? DEV_BYPASS_TOKEN).toString();

  // 2) Гард окружения (как раньше)
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production';
  const isNonProd = env !== 'production';
  const BYPASS_ENABLED = process.env.VITE_DEV_BYPASS_ENABLED === 'true';
  const allowed = (isNonProd && BYPASS_ENABLED) || (BYPASS_ENABLED && requestedToken === DEV_BYPASS_TOKEN);
  if (!allowed) return J({ error:'forbidden', env, BYPASS_ENABLED, requestedToken, DEV_BYPASS_TOKEN }, 403);

  // 3) ENV
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return J({ error:'server_misconfig', SUPABASE_URL:!!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY:!!SERVICE_KEY }, 200);
  }

  // 4) Пинг PostgREST и чтение схемы (диагностика)
  try {
    const ping = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}` }
    });
    const listTxt = await ping.text().catch(()=>'(no text)');
    // не критично, но полезно видеть, отвечает ли шлюз
    var gateway = { ok: ping.ok, status: ping.status, body: listTxt.slice(0,2000) };
  } catch (e:any) {
    return J({ error:'postgrest_unreachable', details: String(e) }, 200);
  }

  // 5) SELECT токена (покажем, что видит БД)
  const sel = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(requestedToken)}&select=id,used,is_completed,expires_at`, {
    headers: {
      apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, Prefer:'return=representation'
    }
  });
  const selText = await sel.text().catch(()=>'(no text)');
  let selJson:any=null; try { selJson = JSON.parse(selText); } catch {}
  if (!sel.ok) return J({ step:'select', ok:false, status: sel.status, body: selText, gateway }, 200);

  // 6) UPSERT (создать/обновить заготовку)
  const upsert = await fetch(`${SUPABASE_URL}/rest/v1/tests`, {
    method:'POST',
    headers:{
      apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      token: requestedToken,
      payment_id: 'dev-payment',
      age: 10, email: 'dev@example.com',
      used: false, is_completed: false, current_step: 1,
      started_at: new Date().toISOString(), completed_at: null,
      expires_at: new Date(Date.now()+90*24*3600*1000).toISOString(),
      cpt_results: null, gonogo_results: null, memory_results: null
    })
  });
  const upText = await upsert.text().catch(()=>'(no text)');
  let upJson:any=null; try { upJson = JSON.parse(upText); } catch {}
  if (!upsert.ok) return J({ step:'upsert', ok:false, status: upsert.status, body: upText, gateway }, 200);

  // 7) PATCH (reset)
  const patch = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(requestedToken)}`, {
    method:'PATCH',
    headers:{
      apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'return=representation'
    },
    body: JSON.stringify({
      used:false, is_completed:false, current_step:1,
      completed_at:null, cpt_results:null, gonogo_results:null, memory_results:null,
      expires_at: new Date(Date.now()+90*24*3600*1000).toISOString()
    })
  });
  const patText = await patch.text().catch(()=>'(no text)');
  let patJson:any=null; try { patJson = JSON.parse(patText); } catch {}
  if (!patch.ok) return J({ step:'patch', ok:false, status: patch.status, body: patText, gateway, select: selJson, upsert: upJson }, 200);

  // 8) Готово
  return J({ ok:true, env, gateway, select: selJson, upsert: upJson, patch: patJson }, 200);
}