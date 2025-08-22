import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Динамический импорт
    const { sendAccessEmail, sendResultsEmail } = await import('./_lib/mailersend');

    if (type === 'access') {
      const testUrl = `${req.headers.origin || 'http://localhost:3000'}/test?token=test-token-123`;
      await sendAccessEmail(email, testUrl);
      
      return res.status(200).json({ 
        ok: true, 
        message: 'Access email sent successfully',
        testUrl 
      });
    } 
    
    if (type === 'results') {
      const mockReportHtml = `
        <h2>Результаты тестирования</h2>
        <p><strong>Внимание:</strong> Хорошо развито</p>
        <p><strong>Самоконтроль:</strong> Средний уровень</p>
        <p><strong>Память:</strong> Отличные показатели</p>
        <p>Это тестовый отчет для проверки отправки email.</p>
      `;
      
      await sendResultsEmail(email, mockReportHtml, 'test-123');
      
      return res.status(200).json({ 
        ok: true, 
        message: 'Results email sent successfully' 
      });
    }

    return res.status(400).json({ 
      error: 'Invalid type. Use "access" or "results"' 
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      ok: false, 
      error: `Failed to send email: ${message}` 
    });
  }
};