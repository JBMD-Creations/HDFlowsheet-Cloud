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
    // Get type from query parameter (default: flowsheet)
    const type = req.query.type || 'flowsheet';

    // Valid types
    const validTypes = ['flowsheet', 'operations', 'snippets'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: flowsheet, operations, or snippets' });
    }

    // Load from Supabase
    const { data, error } = await supabase
      .from('app_data')
      .select('data, updated_at')
      .eq('type', type)
      .single();

    if (error) {
      // No data found is not an error - return empty
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'No saved data found', exists: false });
      }
      throw error;
    }

    // Return the data
    return res.status(200).json(data.data);

  } catch (error) {
    console.error('Load error:', error);
    return res.status(500).json({ error: 'Failed to load data', details: error.message });
  }
}
