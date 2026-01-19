import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../lib/auth.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_BACKUPS = 5; // Keep last 5 backups per user

// Helper function to backup current checklists before overwriting
async function backupCurrentChecklists(userId) {
  try {
    // Fetch current checklists
    const { data: checklistsData, error: checklistsError } = await supabase
      .from('checklists')
      .select('*')
      .eq('user_id', userId);

    if (checklistsError || !checklistsData || checklistsData.length === 0) {
      return; // Nothing to backup
    }

    const checklistIds = checklistsData.map(c => c.id);

    // Get folders
    const { data: foldersData } = await supabase
      .from('checklist_folders')
      .select('*')
      .in('checklist_id', checklistIds);

    // Get items
    const { data: itemsData } = await supabase
      .from('checklist_items')
      .select('*')
      .in('checklist_id', checklistIds);

    // Build backup structure
    const backupData = {
      checklists: checklistsData,
      folders: foldersData || [],
      items: itemsData || [],
      backupTimestamp: new Date().toISOString()
    };

    // Save backup to app_data table
    const backupType = `checklist_backup_${Date.now()}`;
    await supabase
      .from('app_data')
      .insert({
        type: backupType,
        user_id: userId,
        data: backupData,
        updated_at: new Date().toISOString()
      });

    // Cleanup old backups (keep only MAX_BACKUPS)
    const { data: allBackups } = await supabase
      .from('app_data')
      .select('id, type, updated_at')
      .eq('user_id', userId)
      .like('type', 'checklist_backup_%')
      .order('updated_at', { ascending: false });

    if (allBackups && allBackups.length > MAX_BACKUPS) {
      const backupsToDelete = allBackups.slice(MAX_BACKUPS).map(b => b.id);
      await supabase
        .from('app_data')
        .delete()
        .in('id', backupsToDelete);
    }

    console.log(`Backup created: ${backupType} (${itemsData?.length || 0} items)`);
  } catch (err) {
    console.error('Backup error (non-fatal):', err);
    // Don't throw - backup failure shouldn't block save
  }
}

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
      const { checklists, completions, action } = req.body;

      // Handle backup listing request
      if (action === 'list_backups') {
        const { data: backups, error } = await supabase
          .from('app_data')
          .select('id, type, data, updated_at')
          .eq('user_id', userId)
          .like('type', 'checklist_backup_%')
          .order('updated_at', { ascending: false })
          .limit(MAX_BACKUPS);

        if (error) throw error;

        const backupList = (backups || []).map(b => ({
          id: b.id,
          type: b.type,
          timestamp: b.data?.backupTimestamp || b.updated_at,
          checklistCount: b.data?.checklists?.length || 0,
          itemCount: b.data?.items?.length || 0
        }));

        return res.status(200).json({ success: true, backups: backupList });
      }

      // Handle restore from backup request
      if (action === 'restore_backup') {
        const { backupId } = req.body;
        if (!backupId) {
          return res.status(400).json({ error: 'backupId required for restore' });
        }

        // Fetch the backup
        const { data: backup, error: backupError } = await supabase
          .from('app_data')
          .select('data')
          .eq('id', backupId)
          .eq('user_id', userId)
          .single();

        if (backupError || !backup) {
          return res.status(404).json({ error: 'Backup not found' });
        }

        const backupData = backup.data;

        // Backup current state before restoring (in case user wants to undo)
        await backupCurrentChecklists(userId);

        // Delete current checklists
        await supabase.from('checklists').delete().eq('user_id', userId);

        // Restore checklists from backup
        if (backupData.checklists && backupData.checklists.length > 0) {
          for (const checklist of backupData.checklists) {
            const { data: newChecklist, error: clError } = await supabase
              .from('checklists')
              .insert({
                name: checklist.name,
                position: checklist.position,
                role: checklist.role || 'General',
                user_id: userId
              })
              .select()
              .single();

            if (clError) throw clError;

            // Restore folders for this checklist
            const oldChecklistId = checklist.id;
            const folderIdMap = {};

            const checklistFolders = (backupData.folders || []).filter(f => f.checklist_id === oldChecklistId);
            for (const folder of checklistFolders) {
              const { data: newFolder, error: fError } = await supabase
                .from('checklist_folders')
                .insert({
                  checklist_id: newChecklist.id,
                  name: folder.name,
                  sort_order: folder.sort_order || 0
                })
                .select()
                .single();

              if (!fError && newFolder) {
                folderIdMap[folder.id] = newFolder.id;
              }
            }

            // Restore items for this checklist
            const checklistItems = (backupData.items || []).filter(i => i.checklist_id === oldChecklistId);
            if (checklistItems.length > 0) {
              const itemsToInsert = checklistItems.map(item => ({
                checklist_id: newChecklist.id,
                folder_id: item.folder_id ? folderIdMap[item.folder_id] || null : null,
                item_text: item.item_text,
                url: item.url || null,
                sort_order: item.sort_order || 0
              }));

              await supabase.from('checklist_items').insert(itemsToInsert);
            }
          }
        }

        return res.status(200).json({
          success: true,
          message: `Restored ${backupData.checklists?.length || 0} checklists with ${backupData.items?.length || 0} items`
        });
      }

      // Normal save operation
      if (!checklists || !Array.isArray(checklists)) {
        return res.status(400).json({ error: 'Invalid data: checklists array required' });
      }

      // SAFETY: Backup current checklists before overwriting
      await backupCurrentChecklists(userId);

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
