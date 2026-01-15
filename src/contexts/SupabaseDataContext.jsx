import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SupabaseDataContext = createContext();

export const useSupabaseData = () => {
  const context = useContext(SupabaseDataContext);
  if (!context) {
    throw new Error('useSupabaseData must be used within a SupabaseDataProvider');
  }
  return context;
};

export const SupabaseDataProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================
  // PATIENTS SYNC
  // ============================================
  const fetchPatients = useCallback(async () => {
    if (!isAuthenticated || !user) return [];

    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          patient_qa(*),
          patient_todos(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to match local format
      return data.map(patient => ({
        id: patient.id,
        name: patient.name,
        chair: patient.chair,
        tech: patient.tech,
        pod: patient.pod,
        section: patient.section,
        shift: patient.shift,
        dryWeight: patient.dry_weight,
        preWeight: patient.pre_weight,
        goalUF: patient.goal_uf,
        postWeight: patient.post_weight,
        startTime: patient.start_time,
        endTime: patient.end_time,
        notes: patient.notes,
        quickNotes: patient.quick_notes || '',
        hospitalized: patient.hospitalized || { isHosp: false, hospital: '' },
        missedTx: patient.missed_tx || { isMissed: false, type: '' },
        wheelchairWeight: patient.wheelchair_weight || {},
        collapsedSections: patient.collapsed_sections || {},
        qa: patient.patient_qa?.[0] ? {
          preCheck: patient.patient_qa[0].pre_check,
          thirtyMin: patient.patient_qa[0].thirty_min,
          meds: patient.patient_qa[0].meds,
          abxIdpn: patient.patient_qa[0].abx_idpn,
          statLabs: patient.patient_qa[0].stat_labs,
          missedTx: patient.patient_qa[0].missed_tx,
          whiteboard: patient.patient_qa[0].whiteboard,
          labsPrep: patient.patient_qa[0].labs_prep,
          ettSigned: patient.patient_qa[0].ett_signed,
          chartClosed: patient.patient_qa[0].chart_closed
        } : {
          preCheck: false, thirtyMin: false, meds: false, abxIdpn: false,
          statLabs: false, missedTx: '', whiteboard: false, labsPrep: false,
          ettSigned: false, chartClosed: false
        },
        miscTodos: (patient.patient_todos || []).map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed
        }))
      }));
    } catch (err) {
      console.error('Error fetching patients:', err);
      setSyncError(err.message);
      return [];
    }
  }, [isAuthenticated, user]);

  const savePatient = useCallback(async (patient) => {
    if (!isAuthenticated || !user) return null;

    try {
      const patientData = {
        user_id: user.id,
        name: patient.name,
        chair: patient.chair,
        tech: patient.tech,
        pod: patient.pod,
        section: patient.section,
        shift: patient.shift,
        dry_weight: patient.dryWeight,
        pre_weight: patient.preWeight,
        goal_uf: patient.goalUF,
        post_weight: patient.postWeight,
        start_time: patient.startTime,
        end_time: patient.endTime,
        notes: patient.notes,
        quick_notes: patient.quickNotes,
        hospitalized: patient.hospitalized,
        missed_tx: patient.missedTx,
        wheelchair_weight: patient.wheelchairWeight,
        collapsed_sections: patient.collapsedSections
      };

      let savedPatient;

      // Check if patient has a cloudId (previously synced) or if the ID is large (from Supabase)
      // Local IDs are small (1, 2, 3...), Supabase bigint IDs are large
      const hasCloudId = patient.cloudId || (typeof patient.id === 'number' && patient.id > 1000000);

      if (hasCloudId) {
        // Update existing cloud patient
        const cloudIdToUse = patient.cloudId || patient.id;
        const { data, error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', cloudIdToUse)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          // If update fails (patient doesn't exist in cloud), insert it
          if (error.code === 'PGRST116') {
            const { data: insertData, error: insertError } = await supabase
              .from('patients')
              .insert(patientData)
              .select()
              .single();

            if (insertError) throw insertError;
            savedPatient = insertData;

            // Create QA record for new patient
            await supabase.from('patient_qa').insert({
              patient_id: savedPatient.id,
              pre_check: patient.qa?.preCheck || false,
              thirty_min: patient.qa?.thirtyMin || false,
              meds: patient.qa?.meds || false,
              abx_idpn: patient.qa?.abxIdpn || false,
              stat_labs: patient.qa?.statLabs || false,
              missed_tx: patient.qa?.missedTx || '',
              whiteboard: patient.qa?.whiteboard || false,
              labs_prep: patient.qa?.labsPrep || false,
              ett_signed: patient.qa?.ettSigned || false,
              chart_closed: patient.qa?.chartClosed || false
            });
          } else {
            throw error;
          }
        } else {
          savedPatient = data;
        }
      } else {
        // Insert new patient to cloud
        const { data, error } = await supabase
          .from('patients')
          .insert(patientData)
          .select()
          .single();

        if (error) throw error;
        savedPatient = data;

        // Create QA record for new patient
        await supabase.from('patient_qa').insert({
          patient_id: savedPatient.id,
          pre_check: patient.qa?.preCheck || false,
          thirty_min: patient.qa?.thirtyMin || false,
          meds: patient.qa?.meds || false,
          abx_idpn: patient.qa?.abxIdpn || false,
          stat_labs: patient.qa?.statLabs || false,
          missed_tx: patient.qa?.missedTx || '',
          whiteboard: patient.qa?.whiteboard || false,
          labs_prep: patient.qa?.labsPrep || false,
          ett_signed: patient.qa?.ettSigned || false,
          chart_closed: patient.qa?.chartClosed || false
        });
      }

      console.log('Patient saved to cloud with ID:', savedPatient.id);
      return savedPatient.id;
    } catch (err) {
      console.error('Error saving patient:', err);
      setSyncError(err.message);
      return null;
    }
  }, [isAuthenticated, user]);

  const updatePatientQA = useCallback(async (patientId, qa) => {
    if (!isAuthenticated || !user) return;

    try {
      const { error } = await supabase
        .from('patient_qa')
        .upsert({
          patient_id: patientId,
          pre_check: qa.preCheck,
          thirty_min: qa.thirtyMin,
          meds: qa.meds,
          abx_idpn: qa.abxIdpn,
          stat_labs: qa.statLabs,
          missed_tx: qa.missedTx,
          whiteboard: qa.whiteboard,
          labs_prep: qa.labsPrep,
          ett_signed: qa.ettSigned,
          chart_closed: qa.chartClosed
        }, { onConflict: 'patient_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating patient QA:', err);
    }
  }, [isAuthenticated, user]);

  const deletePatient = useCallback(async (patientId) => {
    if (!isAuthenticated || !user) return;

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting patient:', err);
      setSyncError(err.message);
    }
  }, [isAuthenticated, user]);

  // ============================================
  // SETTINGS SYNC
  // ============================================
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated || !user) return null;

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (err) {
      console.error('Error fetching settings:', err);
      return null;
    }
  }, [isAuthenticated, user]);

  const saveSettings = useCallback(async (settings) => {
    if (!isAuthenticated || !user) return;

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          theme: settings.theme,
          technicians: settings.technicians,
          sections: settings.sections,
          auto_save_enabled: settings.autoSaveEnabled
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving settings:', err);
      setSyncError(err.message);
    }
  }, [isAuthenticated, user]);

  // ============================================
  // CHECKLISTS SYNC
  // ============================================
  const fetchChecklists = useCallback(async () => {
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
      return data || [];
    } catch (err) {
      console.error('Error fetching checklists:', err);
      return [];
    }
  }, [isAuthenticated, user]);

  // ============================================
  // FULL SYNC
  // ============================================
  const syncAll = useCallback(async () => {
    if (!isAuthenticated || !isOnline) return;

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const [patients, settings, checklists] = await Promise.all([
        fetchPatients(),
        fetchSettings(),
        fetchChecklists()
      ]);

      setLastSyncTime(new Date());
      setSyncStatus('synced');

      return { patients, settings, checklists };
    } catch (err) {
      console.error('Error syncing:', err);
      setSyncError(err.message);
      setSyncStatus('error');
      return null;
    }
  }, [isAuthenticated, isOnline, fetchPatients, fetchSettings, fetchChecklists]);

  // Sync on auth change
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      syncAll();
    } else if (!isAuthenticated) {
      setSyncStatus('idle');
    }
  }, [isAuthenticated, isOnline, syncAll]);

  const value = {
    // Status
    syncStatus,
    lastSyncTime,
    syncError,
    isOnline,
    isAuthenticated,

    // Patient operations
    fetchPatients,
    savePatient,
    updatePatientQA,
    deletePatient,

    // Settings operations
    fetchSettings,
    saveSettings,

    // Checklists operations
    fetchChecklists,

    // Full sync
    syncAll
  };

  return (
    <SupabaseDataContext.Provider value={value}>
      {children}
    </SupabaseDataContext.Provider>
  );
};
