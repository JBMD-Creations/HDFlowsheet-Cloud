import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../lib/auth.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get type from query parameters
    const type = req.query.type || 'flowsheet';

    // Authenticate: prefer JWT, fall back to user_id param
    let userId = null;
    const { user, error: authError } = await verifyAuth(req);

    if (user) {
      userId = user.id;
    } else if (req.query.user_id) {
      // Fallback for backward compatibility (deprecated)
      userId = req.query.user_id;
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

    // Load from Supabase - filter by type and user_id
    const { data, error } = await supabase
      .from('app_data')
      .select('data, updated_at')
      .eq('type', type)
      .eq('user_id', userId)
      .single();

    if (error) {
      // No data found is not an error - return empty object
      if (error.code === 'PGRST116') {
        return res.status(200).json({ success: true, data: {} });
      }
      throw error;
    }

    // Return the data in expected format
    return res.status(200).json({ success: true, data: data.data });

  } catch (error) {
    console.error('Load error:', error);
    return res.status(500).json({ error: 'Failed to load data', details: error.message });
  }
}
