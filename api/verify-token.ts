import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminClient } from './_lib/supabaseServer.js';

const maskEmail = (email: string | null): string => {
  if (!email) {
    return '[email protected]'; // Return a placeholder if email is null or empty
  }
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return email; // Return original string if it's not a valid email format
  }
  const maskedLocalPart = `${localPart.substring(0, 2)}...`;
  return `${maskedLocalPart}@${domain}`;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const supabase = getAdminClient();
    const { data: test, error } = await supabase
      .from('tests')
      .select('email, used, expires_at')
      .eq('token', token)
      .single();

    if (error || !test) {
      return res.status(200).json({ valid: false });
    }

    const now = new Date();
    const expiresAt = new Date(test.expires_at);

    if (test.used || now > expiresAt) {
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({
      valid: true,
      email: maskEmail(test.email),
      expiresAt: test.expires_at,
    });

  } catch (error) {
    console.error('Token verification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};