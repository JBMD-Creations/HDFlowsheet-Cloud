import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePatients } from './PatientContext';
import { useOperations } from './OperationsContext';
import { useSnippets } from './SnippetContext';
import { useTheme } from './ThemeContext';

const SaveContext = createContext();

export const useSave = () => {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSave must be used within a SaveProvider');
  }
  return context;
};

// Save status types
const SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error'
};

export const SaveProvider = ({ children }) => {
  const { patients } = usePatients();
  const { checklists, labs, completions } = useOperations();
  const { configurations, activeConfigId } = useSnippets();
  const { theme, technicians } = useTheme();

  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);
  const [lastSaved, setLastSaved] = useState(() => {
    const saved = localStorage.getItem('hd-last-saved');
    return saved ? new Date(saved) : null;
  });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    const saved = localStorage.getItem('hd-autosave-enabled');
    return saved !== 'false';
  });
  const [autoSaveInterval, setAutoSaveInterval] = useState(() => {
    const saved = localStorage.getItem('hd-autosave-interval');
    return saved ? parseInt(saved) : 60000;
  });

  // Track data changes to know when to update lastSaved
  const dataSignature = useMemo(() => {
    return JSON.stringify({ patients, checklists, configurations, theme, technicians });
  }, [patients, checklists, configurations, theme, technicians]);

  const prevSignatureRef = useRef(dataSignature);

  // Update lastSaved when data changes (contexts auto-save to localStorage)
  useEffect(() => {
    if (prevSignatureRef.current !== dataSignature) {
      const now = new Date();
      localStorage.setItem('hd-last-saved', now.toISOString());
      setLastSaved(now);
      prevSignatureRef.current = dataSignature;
    }
  }, [dataSignature]);

  // Persist auto-save settings
  useEffect(() => {
    localStorage.setItem('hd-autosave-enabled', autoSaveEnabled.toString());
  }, [autoSaveEnabled]);

  useEffect(() => {
    localStorage.setItem('hd-autosave-interval', autoSaveInterval.toString());
  }, [autoSaveInterval]);

  // Manual save button (just shows feedback - data is already auto-saved by each context)
  const saveAll = useCallback(async () => {
    setSaveStatus(SAVE_STATUS.SAVING);

    try {
      // Brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));

      const now = new Date();
      localStorage.setItem('hd-last-saved', now.toISOString());
      setLastSaved(now);

      setSaveStatus(SAVE_STATUS.SAVED);
      setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 2000);

      return { success: true };
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus(SAVE_STATUS.ERROR);
      setTimeout(() => setSaveStatus(SAVE_STATUS.IDLE), 3000);
      return { success: false, error };
    }
  }, []);

  // Export all data as JSON
  const exportAllData = useCallback(() => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      patients,
      checklists,
      labs,
      completions,
      snippetConfigurations: configurations,
      activeSnippetConfigId: activeConfigId,
      theme,
      technicians
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hdflowsheet-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [patients, checklists, labs, completions, configurations, activeConfigId, theme, technicians]);

  // Clear all data
  const clearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      localStorage.removeItem('hd-patients');
      localStorage.removeItem('hd-checklists');
      localStorage.removeItem('hd-labs');
      localStorage.removeItem('hd-checklist-completions');
      localStorage.removeItem('hd-snippet-configs');
      localStorage.removeItem('hd-active-snippet-config');
      localStorage.removeItem('hd-technicians');
      localStorage.removeItem('hd-last-saved');
      localStorage.removeItem('hd-next-id');
      window.location.reload();
    }
  }, []);

  const value = {
    // Status
    saveStatus,
    SAVE_STATUS,
    lastSaved,

    // Actions
    saveAll,
    exportAllData,
    clearAllData,

    // Auto-save settings (kept for settings UI)
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval
  };

  return (
    <SaveContext.Provider value={value}>
      {children}
    </SaveContext.Provider>
  );
};
