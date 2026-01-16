import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get type and user_id from query parameters
    const type = req.query.type || 'flowsheet';
    const userId = req.query.user_id || null;

    // Valid types
    const validTypes = ['flowsheet', 'operations', 'snippets', 'labs', 'timestamp_logs', 'wheelchair_profiles'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: flowsheet, operations, snippets, labs, timestamp_logs, or wheelchair_profiles' });
    }

    // Load from Supabase - filter by type and user_id
    let query = supabase
      .from('app_data')
      .select('data, updated_at')
      .eq('type', type);

    // Filter by user_id (null for anonymous users)
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query.single();

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
