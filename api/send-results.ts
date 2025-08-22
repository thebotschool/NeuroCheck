import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testId, email, reportHtml } = req.body;

    if (!testId || !email || !reportHtml) {
      return res.status(400).json({ 
        error: 'Missing required fields: testId, email, reportHtml' 
      });
    }

    // Динамический импорт для избежания проблем с загрузкой
    const { sendResultsEmail } = await import('./_lib/mailersend');

    await sendResultsEmail(email, reportHtml, testId);

    return res.status(200).json({ 
      ok: true, 
      message: 'Results email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending results email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      ok: false, 
      error: `Failed to send results email: ${message}` 
    });
  }
};