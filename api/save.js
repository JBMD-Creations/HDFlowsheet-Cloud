import { supabase } from '../lib/supabase.js';

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

    // Upsert to Supabase (insert or update)
    // Use composite key: type + user_id
    const { data, error } = await supabase
      .from('app_data')
      .upsert({
        type: type,
        user_id: userId,
        data: dataToSave,
        updated_at: timestamp
      }, {
        onConflict: 'type,user_id'
      })
      .select();

    if (error) {
      throw error;
    }

    // Also save to backup history (optional - keeps last 30 per user per type)
    await supabase
      .from('app_data_backups')
      .insert({
        type: type,
        user_id: userId,
        data: dataToSave,
        created_at: timestamp
      });

    // Clean up old backups (keep last 30 per type per user)
    const backupQuery = supabase
      .from('app_data_backups')
      .select('id, created_at')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (userId) {
      backupQuery.eq('user_id', userId);
    }

    const { data: backups } = await backupQuery;

    if (backups && backups.length > 30) {
      const toDelete = backups.slice(30).map(b => b.id);
      await supabase
        .from('app_data_backups')
        .delete()
        .in('id', toDelete);
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
