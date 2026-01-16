import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Load all checklists with folders, items, and completions
    if (req.method === 'GET') {
      // Get all checklists
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('checklists')
        .select('*')
        .order('position', { ascending: true });

      if (checklistsError) throw checklistsError;

      // Get all folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('checklist_folders')
        .select('*')
        .order('sort_order', { ascending: true });

      if (foldersError) throw foldersError;

      // Get all items
      const { data: itemsData, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      // Get today's completions
      const today = new Date().toISOString().split('T')[0];
      const { data: completionsData, error: completionsError } = await supabase
        .from('checklist_completions')
        .select('*')
        .eq('completion_date', today);

      if (completionsError) throw completionsError;

      // Build the nested structure expected by frontend
      const checklists = checklistsData.map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        position: checklist.position,
        folders: foldersData
          .filter(f => f.checklist_id === checklist.id)
          .map(f => ({
            id: f.id,
            name: f.name,
            order: f.sort_order
          })),
        items: itemsData
          .filter(i => i.checklist_id === checklist.id)
          .map(i => ({
            id: i.id,
            text: i.item_text,
            order: i.sort_order,
            folderId: i.folder_id,
            url: i.url
          }))
      }));

      // Build completions object: { "date_checklistId": { completedItems: [itemId, ...], timestamp } }
      const completionsByChecklist = {};

      completionsData.forEach(c => {
        const key = `${c.completion_date}_${c.checklist_id}`;
        if (!completionsByChecklist[key]) {
          completionsByChecklist[key] = {
            completedItems: [],
            timestamp: c.completed_at
          };
        }
        completionsByChecklist[key].completedItems.push(c.item_id);
      });

      return res.status(200).json({
        success: true,
        data: {
          checklists,
          completions: completionsByChecklist
        }
      });
    }

    // POST - Save all checklists (replace all)
    if (req.method === 'POST') {
      const { checklists, completions } = req.body;

      if (!checklists || !Array.isArray(checklists)) {
        return res.status(400).json({ error: 'Invalid data: checklists array required' });
      }

      // Delete all existing checklists (cascade will handle related tables)
      const { error: deleteError } = await supabase
        .from('checklists')
        .delete()
        .gte('id', 0);

      if (deleteError) throw deleteError;

      // Insert checklists, folders, and items
      for (const checklist of checklists) {
        // Insert checklist
        const { data: newChecklist, error: checklistError } = await supabase
          .from('checklists')
          .insert({
            id: checklist.id,
            name: checklist.name,
            position: checklist.position || 0
          })
          .select()
          .single();

        if (checklistError) throw checklistError;

        // Insert folders
        if (checklist.folders && checklist.folders.length > 0) {
          const foldersToInsert = checklist.folders.map(f => ({
            id: f.id,
            checklist_id: checklist.id,
            name: f.name,
            sort_order: f.order || 0
          }));

          const { error: foldersError } = await supabase
            .from('checklist_folders')
            .insert(foldersToInsert);

          if (foldersError) throw foldersError;
        }

        // Insert items
        if (checklist.items && checklist.items.length > 0) {
          const itemsToInsert = checklist.items.map(i => ({
            id: i.id,
            checklist_id: checklist.id,
            folder_id: i.folderId || null,
            item_text: i.text,
            url: i.url || null,
            sort_order: i.order || 0
          }));

          const { error: itemsError } = await supabase
            .from('checklist_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      // Save completions for today
      if (completions && typeof completions === 'object') {
        const today = new Date().toISOString().split('T')[0];

        // Delete today's completions first
        await supabase
          .from('checklist_completions')
          .delete()
          .eq('completion_date', today);

        // Insert new completions
        const completionsToInsert = [];

        for (const [key, value] of Object.entries(completions)) {
          // key format: "date_checklistId"
          const [date, checklistId] = key.split('_');

          if (value.completedItems && Array.isArray(value.completedItems)) {
            for (const itemId of value.completedItems) {
              completionsToInsert.push({
                checklist_id: parseInt(checklistId),
                item_id: parseInt(itemId),
                completion_date: date,
                completed_at: value.timestamp || new Date().toISOString()
              });
            }
          }
        }

        if (completionsToInsert.length > 0) {
          const { error: compError } = await supabase
            .from('checklist_completions')
            .insert(completionsToInsert);

          if (compError) {
            console.error('Completions insert error:', compError);
            // Don't throw - completions are less critical
          }
        }
      }

      return res.status(200).json({ success: true, message: 'Checklists saved' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Checklists API error:', error);
    return res.status(500).json({ error: 'Failed to process checklists', details: error.message });
  }
}
