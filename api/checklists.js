import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../lib/auth.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate: prefer JWT, fall back to user_id param
    let userId = null;
    const { user, error: authError } = await verifyAuth(req);

    if (user) {
      userId = user.id;
    } else {
      // Fallback for backward compatibility (deprecated)
      const paramUserId = req.query.user_id || req.body?.user_id;
      if (paramUserId) {
        userId = paramUserId;
        console.warn('DEPRECATED: Using user_id param instead of JWT auth');
      }
    }

    // Require authentication
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required', details: authError });
    }

    // GET - Load checklists with folders, items, and completions for this user
    if (req.method === 'GET') {
      // Get checklists for this user
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('checklists')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (checklistsError) throw checklistsError;

      // Get checklist IDs for this user
      const checklistIds = checklistsData.map(c => c.id);

      // Get folders for these checklists
      let foldersData = [];
      if (checklistIds.length > 0) {
        const { data, error } = await supabase
          .from('checklist_folders')
          .select('*')
          .in('checklist_id', checklistIds)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        foldersData = data || [];
      }

      // Get items for these checklists
      let itemsData = [];
      if (checklistIds.length > 0) {
        const { data, error } = await supabase
          .from('checklist_items')
          .select('*')
          .in('checklist_id', checklistIds)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        itemsData = data || [];
      }

      // Get today's completions for these checklists
      const today = new Date().toISOString().split('T')[0];
      let completionsData = [];
      if (checklistIds.length > 0) {
        const { data, error } = await supabase
          .from('checklist_completions')
          .select('*')
          .in('checklist_id', checklistIds)
          .eq('completion_date', today);
        if (error) throw error;
        completionsData = data || [];
      }

      // Build the nested structure expected by frontend
      const checklists = checklistsData.map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        position: checklist.role || 'General',
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

      // Build completions object
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

    // POST - Save all checklists for this user (replace all)
    if (req.method === 'POST') {
      const { checklists, completions } = req.body;

      if (!checklists || !Array.isArray(checklists)) {
        return res.status(400).json({ error: 'Invalid data: checklists array required' });
      }

      // Delete existing checklists for this user (cascade handles related tables)
      const { error: deleteError } = await supabase
        .from('checklists')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert checklists, folders, and items
      for (let i = 0; i < checklists.length; i++) {
        const checklist = checklists[i];

        // Insert checklist
        const { data: newChecklist, error: checklistError } = await supabase
          .from('checklists')
          .insert({
            name: checklist.name,
            position: i,
            role: checklist.position || 'General',
            user_id: userId
          })
          .select()
          .single();

        if (checklistError) throw checklistError;

        const newChecklistId = newChecklist.id;

        // Insert folders and build ID mapping
        const folderIdMap = {};
        if (checklist.folders && checklist.folders.length > 0) {
          for (const f of checklist.folders) {
            const { data: newFolder, error: folderError } = await supabase
              .from('checklist_folders')
              .insert({
                checklist_id: newChecklistId,
                name: f.name,
                sort_order: f.order || 0
              })
              .select()
              .single();

            if (folderError) throw folderError;
            folderIdMap[f.id] = newFolder.id;
          }
        }

        // Insert items
        if (checklist.items && checklist.items.length > 0) {
          const itemsToInsert = checklist.items.map(item => ({
            checklist_id: newChecklistId,
            folder_id: item.folderId ? folderIdMap[item.folderId] || null : null,
            item_text: item.text,
            url: item.url || null,
            sort_order: item.order || 0
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
