import { getAdminClient } from './_lib/supabaseServer.mjs';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { quantity, adminKey } = req.body;

    // 1. Validate Admin Key
    const expectedAdminKey = process.env.ADMIN_KEY;

    // Securely log key details for debugging
    console.log('Admin Key Validation:');
    console.log(`  - Received Key Length: ${adminKey?.length || 0}`);
    console.log(`  - Expected Key Length: ${expectedAdminKey?.length || 0}`);
    console.log(`  - Keys Match: ${adminKey === expectedAdminKey}`);

    if (!expectedAdminKey || adminKey !== expectedAdminKey) {
      return res.status(403).json({ error: 'Invalid admin key' });
    }

    // 2. Validate Quantity
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity < 1 || numQuantity > 100) {
      return res.status(400).json({ error: 'Invalid quantity. Must be between 1 and 100.' });
    }

    // 3. Generate Promo Codes
    const supabase = getAdminClient();
    const generatedTokens = [];
    const codesToInsert = [];

    for (let i = 0; i < numQuantity; i++) {
      // A simple promo code format
      const token = `PROMO-${randomUUID().slice(0, 8).toUpperCase()}`;
      generatedTokens.push(token);
      codesToInsert.push({
        code: token,
        // expires_at can be set here if needed
      });
    }

    // 4. Insert into Supabase
    // Assuming a 'promo_codes' table with a 'code' column
    const { data, error } = await supabase
      .from('promo_codes')
      .insert(codesToInsert)
      .select();

    if (error) {
      console.error('Error inserting promo codes:', error);
      // Handle potential duplicate codes, though highly unlikely
      if (error.code === '23505') { // unique_violation
        return res.status(500).json({ error: 'Failed to generate unique codes. Please try again.' });
      }
      return res.status(500).json({ error: 'Failed to save promo codes.' });
    }

    // 5. Return generated codes
    return res.status(200).json({ ok: true, tokens: generatedTokens });

  } catch (e) {
    console.error('Error in create-promo handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}