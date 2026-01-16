import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../lib/auth.js';

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

    // Get type and data from body
    const type = body.type || 'flowsheet';
    const dataToSave = body.data || body;

    // Authenticate: prefer JWT, fall back to user_id param
    let userId = null;
    const { user, error: authError } = await verifyAuth(req);

    if (user) {
      userId = user.id;
    } else if (body.user_id) {
      // Fallback for backward compatibility (deprecated)
      userId = body.user_id;
      console.warn('DEPRECATED: Using user_id param instead of JWT auth');
    }

    // Require authentication
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required', details: authError });
    }

    // Valid types
    const validTypes = ['flowsheet', 'operations', 'snippets', 'labs', 'timestamp_logs', 'wheelchair_profiles'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: flowsheet, operations, snippets, labs, timestamp_logs, or wheelchair_profiles' });
    }

    const timestamp = new Date().toISOString();

    // Build the record to upsert
    const record = {
      type: type,
      user_id: userId,
      data: dataToSave,
      updated_at: timestamp
    };

    // Upsert with composite key
    const { error } = await supabase
      .from('app_data')
      .upsert(record, { onConflict: 'type,user_id' })
      .select();

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
