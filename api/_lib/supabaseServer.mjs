const { createClient } = require('@supabase/supabase-js');

let adminClient = null;

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`Supabase admin env missing: SUPABASE_URL=${!!url}, SUPABASE_SERVICE_ROLE_KEY=${!!key}`);
  }
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return adminClient;
}

module.exports = {
  config: { runtime: "nodejs" },
  getAdminClient
};
