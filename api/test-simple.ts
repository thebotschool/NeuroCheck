// api/test-simple.ts
// Простой тест API

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Simple test endpoint called');
  
  return res.status(200).json({ 
    ok: true, 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });
}