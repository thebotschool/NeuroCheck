import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminClient } from './_lib/supabaseServer.js';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }

    // Vercel automatically parses the body for JSON content-type, but we add a check for safety.
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { token, markAsCompleted } = req.body;

    // The dev token should be infinitely reusable, so we don't actually consume it.
    if (token === 'dev-token-123') {
      return res.status(200).json({ consumed: true });
    }

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    const supabase = getAdminClient();
    const { data: test, error } = await supabase
      .from('tests')
      .select('used, expires_at')
      .eq('token', token)
      .single();

    if (error || !test) {
      return res.status(200).json({ consumed: false, reason: 'Token not found' });
    }

    const now = new Date();
    const expiresAt = new Date(test.expires_at);

    if (test.used) {
      return res.status(200).json({ consumed: false, reason: 'Token already used' });
    }

    if (now > expiresAt) {
      return res.status(200).json({ consumed: false, reason: 'Token expired' });
    }

    const updates: { used: boolean; updated_at: string; is_completed?: boolean } = {
      used: true,
      updated_at: now.toISOString(),
    };

    if (markAsCompleted) {
      updates.is_completed = true;
    }

    const { error: updateError } = await supabase
      .from('tests')
      .update(updates)
      .eq('token', token);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({ consumed: true });

  } catch (error) {
    console.error('[consume-token error]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: `Server error in consume-token: ${message}` });
  }
};