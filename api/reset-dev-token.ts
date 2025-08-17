import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminClient } from './_lib/supabaseServer.js';

const DEV_TOKEN = 'dev-token-123';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }

    const supabase = getAdminClient();

    const { error } = await supabase
      .from('tests')
      .update({
        used: false,
        is_completed: false,
        completed_at: null,
        cpt_results: null,
        gonogo_results: null,
        memory_results: null,
        current_step: 1,
        age: null,
        started_at: new Date().toISOString(),
      })
      .eq('token', DEV_TOKEN);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, message: 'Dev token has been reset.' });

  } catch (error) {
    console.error('[reset-dev-token error]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: `Server error in reset-dev-token: ${message}` });
  }
};
