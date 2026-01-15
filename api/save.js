import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    // Valid types
    const validTypes = ['flowsheet', 'operations', 'snippets'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: flowsheet, operations, or snippets' });
    }

    const timestamp = new Date().toISOString();

    // Upsert to Supabase (insert or update)
    const { data, error } = await supabase
      .from('app_data')
      .upsert({
        type: type,
        data: dataToSave,
        updated_at: timestamp
      }, {
        onConflict: 'type'
      })
      .select();

    if (error) {
      throw error;
    }

    // Also save to backup history (optional - keeps last 30)
    await supabase
      .from('app_data_backups')
      .insert({
        type: type,
        data: dataToSave,
        created_at: timestamp
      });

    // Clean up old backups (keep last 30 per type)
    const { data: backups } = await supabase
      .from('app_data_backups')
      .select('id, created_at')
      .eq('type', type)
      .order('created_at', { ascending: false });

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
