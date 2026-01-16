import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // Validate JSON
    if (!body) {
      return res.status(400).json({ error: 'Invalid JSON data' });
    }

    // Get type, data, and user_id from body
    const type = body.type || 'flowsheet';
    const dataToSave = body.data || body;
    const userId = body.user_id || null;

    // Valid types
    const validTypes = ['flowsheet', 'operations', 'snippets', 'labs', 'timestamp_logs', 'wheelchair_profiles'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: flowsheet, operations, snippets, labs, timestamp_logs, or wheelchair_profiles' });
    }

    const timestamp = new Date().toISOString();

    // Build the record to upsert
    const record = {
      type: type,
      data: dataToSave,
      updated_at: timestamp
    };

    // Only include user_id if it's provided (backward compatible)
    if (userId) {
      record.user_id = userId;
    }

    // Try upsert with composite key first, fallback to type-only key
    let error;

    if (userId) {
      // User is logged in - try composite key first
      const result = await supabase
        .from('app_data')
        .upsert(record, { onConflict: 'type,user_id' })
        .select();
      error = result.error;

      // If composite key doesn't exist, fall back to type-only
      if (error && error.message && error.message.includes('user_id')) {
        const fallbackResult = await supabase
          .from('app_data')
          .upsert({ type, data: dataToSave, updated_at: timestamp }, { onConflict: 'type' })
          .select();
        error = fallbackResult.error;
      }
    } else {
      // No user - use type-only key
      const result = await supabase
        .from('app_data')
        .upsert({ type, data: dataToSave, updated_at: timestamp }, { onConflict: 'type' })
        .select();
      error = result.error;
    }

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Data saved successfully',
      type: type,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
}
