import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const OperationsContext = createContext();

export const useOperations = () => {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
};

export const OperationsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const syncDebounceRef = useRef(null);

  // Checklists state
  const [checklists, setChecklists] = useState(() => {
    const saved = localStorage.getItem('hd-checklists');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeChecklistId, setActiveChecklistId] = useState(null);
  const [completions, setCompletions] = useState(() => {
    const saved = localStorage.getItem('hd-checklist-completions');
    return saved ? JSON.parse(saved) : {};
  });

  // Labs state
  const [labs, setLabs] = useState(() => {
    const saved = localStorage.getItem('hd-labs');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage (fallback)
  useEffect(() => {
    localStorage.setItem('hd-checklists', JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem('hd-checklist-completions', JSON.stringify(completions));
  }, [completions]);

  useEffect(() => {
    localStorage.setItem('hd-labs', JSON.stringify(labs));
  }, [labs]);

  // ============================================
  // CLOUD SYNC FUNCTIONS
  // ============================================

  // Fetch checklists from Supabase
  const fetchCloudChecklists = useCallback(async () => {
    if (!isAuthenticated || !user) return [];

    try {
      const { data, error } = await supabase
        .from('checklists')
        .select(`
          *,
          checklist_folders(
            *,
            checklist_items(*)
          )
        `)
        .eq('user_id', user.id)
        .order('order_position', { ascending: true });

      if (error) throw error;

      // Transform to local format
      return (data || []).map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        position: checklist.position,
        order: checklist.order_position,
        folders: (checklist.checklist_folders || []).map(folder => ({
          id: folder.id,
          name: folder.name,
          order: folder.order_position,
          items: (folder.checklist_items || []).map(item => ({
            id: item.id,
            text: item.text,
            url: item.url,
            order: item.order_position
          }))
        })),
        items: [] // Legacy flat items array
      }));
    } catch (err) {
      console.error('Error fetching checklists:', err);
      return [];
    }
  }, [isAuthenticated, user]);

  // Save checklist to Supabase
  const saveChecklistToCloud = useCallback(async (checklist) => {
    if (!isAuthenticated || !user) return null;

    try {
      const checklistData = {
        user_id: user.id,
        name: checklist.name,
        position: checklist.position || '',
        order_position: checklist.order || 0
      };

      let savedChecklist;
      const isCloudId = checklist.id > 1000000;

      if (isCloudId) {
        // Update existing - use maybeSingle() to handle case where row doesn't exist
        const { data, error } = await supabase
          .from('checklists')
          .update(checklistData)
          .eq('id', checklist.id)
          .eq('user_id', user.id)
          .select()
          .maybeSingle();

        if (error) throw error;

        // If update returned no rows, the checklist doesn't exist - insert instead
        if (!data) {
          const { data: insertedData, error: insertError } = await supabase
            .from('checklists')
            .insert(checklistData)
            .select()
            .single();

          if (insertError) throw insertError;
          savedChecklist = insertedData;
        } else {
          savedChecklist = data;
        }
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('checklists')
          .insert(checklistData)
          .select()
          .single();

        if (error) throw error;
        savedChecklist = data;
      }

      // Sync folders and items
      if (checklist.folders && checklist.folders.length > 0) {
        for (const folder of checklist.folders) {
          await saveFolderToCloud(savedChecklist.id, folder);
        }
      }

      console.log('Checklist saved to cloud:', savedChecklist.id);
      return savedChecklist.id;
    } catch (err) {
      console.error('Error saving checklist:', err);
      return null;
    }
  }, [isAuthenticated, user]);

  // Save folder to cloud
  const saveFolderToCloud = async (checklistId, folder) => {
    if (!isAuthenticated || !user) return null;

    try {
      const folderData = {
        checklist_id: checklistId,
        name: folder.name,
        order_position: folder.order || 0
      };

      let savedFolder;
      const isCloudId = folder.id > 1000000;

      if (isCloudId) {
        const { data, error } = await supabase
          .from('checklist_folders')
          .update(folderData)
          .eq('id', folder.id)
          .select()
          .single();

        if (error) throw error;
        savedFolder = data;
      } else {
        const { data, error } = await supabase
          .from('checklist_folders')
          .insert(folderData)
          .select()
          .single();

        if (error) throw error;
        savedFolder = data;
      }

      // Sync items in folder
      if (folder.items && folder.items.length > 0) {
        for (const item of folder.items) {
          await saveItemToCloud(savedFolder.id, item);
        }
      }

      return savedFolder.id;
    } catch (err) {
      console.error('Error saving folder:', err);
      return null;
    }
  };

  // Save item to cloud
  const saveItemToCloud = async (folderId, item) => {
    if (!isAuthenticated || !user) return null;

    try {
      const itemData = {
        folder_id: folderId,
        text: item.text,
        url: item.url || null,
        order_position: item.order || 0
      };

      const isCloudId = item.id > 1000000;

      if (isCloudId) {
        const { error } = await supabase
          .from('checklist_items')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('checklist_items')
          .insert(itemData);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  // Debounced sync
  const syncChecklistToCloud = useCallback((checklist) => {
    if (!isAuthenticated) return;

    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    syncDebounceRef.current = setTimeout(() => {
      saveChecklistToCloud(checklist);
    }, 1000);
  }, [isAuthenticated, saveChecklistToCloud]);

  // Load from cloud on auth
  useEffect(() => {
    const loadFromCloud = async () => {
      if (isAuthenticated && user) {
        const cloudChecklists = await fetchCloudChecklists();
        if (cloudChecklists && cloudChecklists.length > 0) {
          setChecklists(cloudChecklists);
        }
      }
    };
    loadFromCloud();
  }, [isAuthenticated, user, fetchCloudChecklists]);

  // Checklist methods
  const addChecklist = (name, position) => {
    const newChecklist = {
      id: Date.now(),
      name,
      position,
      order: checklists.length,
      folders: [],
      items: []
    };
    setChecklists(prev => [...prev, newChecklist]);
    syncChecklistToCloud(newChecklist);
    return newChecklist;
  };

  const updateChecklist = (checklistId, updates) => {
    setChecklists(prev => {
      const updated = prev.map(c => (c.id === checklistId ? { ...c, ...updates } : c));
      const updatedChecklist = updated.find(c => c.id === checklistId);
      if (updatedChecklist) {
        syncChecklistToCloud(updatedChecklist);
      }
      return updated;
    });
  };

  const deleteChecklist = async (checklistId) => {
    setChecklists(prev => prev.filter(c => c.id !== checklistId));

    if (isAuthenticated && user) {
      try {
        await supabase
          .from('checklists')
          .delete()
          .eq('id', checklistId)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error deleting checklist from cloud:', err);
      }
    }
  };

  // Lab methods
  const addLab = (patientName, timestamp) => {
    const newLab = {
      id: Date.now(),
      patientName,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setLabs(prev => [newLab, ...prev]);
    return newLab;
  };

  const deleteLab = (labId) => {
    setLabs(prev => prev.filter(l => l.id !== labId));
  };

  const clearAllLabs = () => {
    setLabs([]);
  };

  const value = {
    // Checklists
    checklists,
    setChecklists,
    activeChecklistId,
    setActiveChecklistId,
    completions,
    setCompletions,
    addChecklist,
    updateChecklist,
    deleteChecklist,

    // Labs
    labs,
    setLabs,
    addLab,
    deleteLab,
    clearAllLabs
  };

  return (
    <OperationsContext.Provider value={value}>
      {children}
    </OperationsContext.Provider>
  );
};
