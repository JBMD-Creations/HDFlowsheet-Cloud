import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get user_id from query params (GET/DELETE) or body (POST)
    const userId = req.query.user_id || req.body?.user_id || null;

    // GET - Load labs for this user
    if (req.method === 'GET') {
      let query = supabase
        .from('labs')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by user_id if provided
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform to match frontend format
      const entries = data.map(row => ({
        id: row.id,
        patientName: row.patient_name,
        labResult: row.lab_result,
        dateTime: row.date_time,
        timestamp: row.created_at
      }));

      return res.status(200).json({ success: true, data: { entries } });
    }

    // POST - Save labs for this user (replace all for this user)
    if (req.method === 'POST') {
      const { entries } = req.body;

      if (!entries || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'Invalid data: entries array required' });
      }

      // Delete existing labs for this user only
      let deleteQuery = supabase
        .from('labs')
        .delete();

      if (userId) {
        deleteQuery = deleteQuery.eq('user_id', userId);
      } else {
        // Fallback: delete all if no user_id (backward compatible)
        deleteQuery = deleteQuery.gte('id', 0);
      }

      const { error: deleteError } = await deleteQuery;
      if (deleteError) throw deleteError;

      // Insert new entries if any
      if (entries.length > 0) {
        const rows = entries.map(entry => ({
          id: entry.id,
          patient_name: entry.patientName,
          lab_result: entry.labResult,
          date_time: entry.dateTime,
          created_at: entry.timestamp || new Date().toISOString(),
          user_id: userId  // Associate with user
        }));

        const { error: insertError } = await supabase
          .from('labs')
          .insert(rows);

        if (insertError) throw insertError;
      }

      return res.status(200).json({ success: true, message: 'Labs saved' });
    }

    // DELETE - Clear labs for this user
    if (req.method === 'DELETE') {
      let deleteQuery = supabase
        .from('labs')
        .delete();

      if (userId) {
        deleteQuery = deleteQuery.eq('user_id', userId);
      } else {
        deleteQuery = deleteQuery.gte('id', 0);
      }

      const { error } = await deleteQuery;

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Labs cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Labs API error:', error);
    return res.status(500).json({ error: 'Failed to process labs', details: error.message });
  }
}
