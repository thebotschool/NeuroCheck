export default async () =>
  new Response(JSON.stringify({
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  }), { status: 200, headers: { 'content-type': 'application/json' }});
