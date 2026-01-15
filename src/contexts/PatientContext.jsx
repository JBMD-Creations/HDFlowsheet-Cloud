import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseData } from './SupabaseDataContext';

const PatientContext = createContext();

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};

const SECTIONS = {
  B1: { name: 'B1', chairs: [1, 2, 3, 4, 5, 6, 7, 8], info: '' },
  B2: { name: 'B2', chairs: [9, 10, 11, 12, 13, 14, 15, 16], info: '' },
  A1: { name: 'A1', chairs: [17, 18, 19, 20, 21, 22, 23, 24], info: '' },
  A2: { name: 'A2', chairs: [25, 26, 27, 28, 29, 30, 31, 32], info: '' },
  TCH: { name: 'TCH', chairs: [33, 34, 35, 36], info: 'Wheelchair patients' }
};

export const PatientProvider = ({ children }) => {
  const {
    isAuthenticated,
    fetchPatients: fetchCloudPatients,
    savePatient: saveCloudPatient,
    updatePatientQA: updateCloudPatientQA,
    deletePatient: deleteCloudPatient,
    syncStatus,
    isOnline
  } = useSupabaseData();

  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('hd-patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [lastCloudSync, setLastCloudSync] = useState(null);
  const syncDebounceRef = useRef(null);

  const [activePatientId, setActivePatientId] = useState(null);
  const [activePod, setActivePod] = useState(null);
  const [activeShift, setActiveShift] = useState('1st');
  const [selectedShifts, setSelectedShifts] = useState(['1st']);
  const [currentSection, setCurrentSection] = useState('B1');
  const [sections] = useState(SECTIONS);
  const [nextId, setNextId] = useState(() => {
    const saved = localStorage.getItem('hd-next-id');
    return saved ? parseInt(saved) : 1;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('hd-patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('hd-next-id', nextId.toString());
  }, [nextId]);

  // Load patients from cloud when authenticated
  useEffect(() => {
    const loadCloudPatients = async () => {
      if (isAuthenticated && cloudSyncEnabled && isOnline) {
        try {
          const cloudPatients = await fetchCloudPatients();
          if (cloudPatients && cloudPatients.length > 0) {
            // Merge cloud patients with local (cloud takes precedence for matching IDs)
            setPatients(prev => {
              const localOnlyPatients = prev.filter(
                local => !cloudPatients.some(cloud => cloud.id === local.id)
              );
              // Update local IDs to avoid conflicts
              const updatedLocalPatients = localOnlyPatients.map(p => ({
                ...p,
                id: typeof p.id === 'number' && p.id < 1000000 ? p.id + Date.now() : p.id
              }));
              return [...cloudPatients, ...updatedLocalPatients];
            });
            setLastCloudSync(new Date());
          }
        } catch (error) {
          console.error('Failed to load cloud patients:', error);
        }
      }
    };

    loadCloudPatients();
  }, [isAuthenticated, cloudSyncEnabled, isOnline, fetchCloudPatients]);

  // Sync patient to cloud with debouncing
  const syncPatientToCloud = useCallback(async (patient) => {
    if (!isAuthenticated || !cloudSyncEnabled || !isOnline) return;

    // Debounce sync to avoid too many requests
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    syncDebounceRef.current = setTimeout(async () => {
      try {
        const cloudId = await saveCloudPatient(patient);
        if (cloudId && cloudId !== patient.id) {
          // Update local patient with cloud ID
          setPatients(prev =>
            prev.map(p => p.id === patient.id ? { ...p, id: cloudId } : p)
          );
        }
        setLastCloudSync(new Date());
      } catch (error) {
        console.error('Failed to sync patient to cloud:', error);
      }
    }, 1000); // 1 second debounce
  }, [isAuthenticated, cloudSyncEnabled, isOnline, saveCloudPatient]);

  // Add patient
  const addPatient = (patientData) => {
    const newPatient = {
      id: nextId,
      name: patientData.name || '',
      chair: patientData.chair || null,
      tech: patientData.tech || '',
      pod: patientData.pod || '',
      section: patientData.section || currentSection,
      shift: patientData.shift || activeShift,
      dryWeight: patientData.dryWeight || null,
      preWeight: patientData.preWeight || null,
      goalUF: patientData.goalUF || null,
      postWeight: patientData.postWeight || null,
      startTime: patientData.startTime || '',
      endTime: patientData.endTime || '',
      notes: patientData.notes || '',
      quickNotes: patientData.quickNotes || '',
      qa: {
        preCheck: false,
        thirtyMin: false,
        meds: false,
        abxIdpn: false,
        statLabs: false,
        missedTx: '',
        whiteboard: false,
        labsPrep: false,
        ettSigned: false,
        chartClosed: false
      },
      hospitalized: { isHosp: false, hospital: '', days: 0 },
      missedTx: { isMissed: false, count: 0, reason: '' },
      miscTodos: [],
      collapsedSections: {},
      wheelchairWeight: {},
      // EOSR-specific fields
      eosr: {
        covid: false,
        earlyTermination: { is: false, minutes: 0, reason: '' },
        medsRescheduled: { is: false, meds: '' },
        statLabs: [],
        sentOut: { is: false, destination: '', reason: '' },
        welfareCheck: { is: false, reason: '' },
        isNewPatient: false,
        midasReport: { is: false, reason: '' },
        accessComplication: { is: false, type: '' },
        disinfectionComplete: true
      },
      ...patientData
    };

    setPatients(prev => [...prev, newPatient]);
    setNextId(prev => prev + 1);

    // Sync to cloud
    syncPatientToCloud(newPatient);

    return newPatient;
  };

  // Update patient
  const updatePatient = (patientId, updates) => {
    setPatients(prev => {
      const updated = prev.map(p => (p.id === patientId ? { ...p, ...updates } : p));
      // Find the updated patient and sync to cloud
      const updatedPatient = updated.find(p => p.id === patientId);
      if (updatedPatient) {
        syncPatientToCloud(updatedPatient);

        // If QA was updated, also sync QA specifically
        if (updates.qa && isAuthenticated && cloudSyncEnabled) {
          updateCloudPatientQA(patientId, updatedPatient.qa);
        }
      }
      return updated;
    });
  };

  // Delete patient
  const deletePatient = (patientId) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    if (activePatientId === patientId) {
      setActivePatientId(null);
    }

    // Delete from cloud
    if (isAuthenticated && cloudSyncEnabled) {
      deleteCloudPatient(patientId);
    }
  };

  // Bulk import patients (from Excel)
  const importPatients = (patientsData) => {
    const newPatients = patientsData.map((data, index) => {
      const id = nextId + index;
      return {
        id,
        name: data.name || '',
        chair: data.chair || null,
        tech: data.tech || '',
        pod: data.pod || '',
        section: data.section || currentSection,
        shift: data.shift || activeShift,
        dryWeight: data.dryWeight || null,
        preWeight: null,
        goalUF: null,
        postWeight: null,
        startTime: '',
        endTime: '',
        notes: '',
        quickNotes: '',
        qa: {
          preCheck: false,
          thirtyMin: false,
          meds: false,
          abxIdpn: false,
          statLabs: false,
          missedTx: '',
          whiteboard: false,
          labsPrep: false,
          ettSigned: false,
          chartClosed: false
        },
        hospitalized: { isHosp: false, hospital: '', days: 0 },
        missedTx: { isMissed: false, count: 0, reason: '' },
        miscTodos: [],
        collapsedSections: {},
        wheelchairWeight: {},
        eosr: {
          covid: false,
          earlyTermination: { is: false, minutes: 0, reason: '' },
          medsRescheduled: { is: false, meds: '' },
          statLabs: [],
          sentOut: { is: false, destination: '', reason: '' },
          welfareCheck: { is: false, reason: '' },
          isNewPatient: false,
          midasReport: { is: false, reason: '' },
          accessComplication: { is: false, type: '' },
          disinfectionComplete: true
        }
      };
    });

    setPatients(prev => [...prev, ...newPatients]);
    setNextId(prev => prev + newPatients.length);

    // Sync each imported patient to cloud
    newPatients.forEach(patient => {
      syncPatientToCloud(patient);
    });
  };

  // Get filtered patients
  const getFilteredPatients = () => {
    return patients.filter(p => {
      // Filter by shift (show unassigned in all shifts)
      if (!p.shift || p.shift === '') {
        return true; // Unassigned patients show in all shifts
      }
      return p.shift === activeShift;
    });
  };

  // Get patients by pod
  const getPatientsByPod = (pod) => {
    return getFilteredPatients().filter(p => p.pod === pod);
  };

  // Get patients by section
  const getPatientsBySection = (section) => {
    return getFilteredPatients().filter(p => p.section === section);
  };

  // Clear all patients
  const clearAllPatients = () => {
    setPatients([]);
    setActivePatientId(null);
    setNextId(1);
  };

  const value = {
    patients,
    setPatients,
    activePatientId,
    setActivePatientId,
    activePod,
    setActivePod,
    activeShift,
    setActiveShift,
    selectedShifts,
    setSelectedShifts,
    currentSection,
    setCurrentSection,
    sections,
    addPatient,
    updatePatient,
    deletePatient,
    importPatients,
    getFilteredPatients,
    getPatientsByPod,
    getPatientsBySection,
    clearAllPatients,
    // Cloud sync
    cloudSyncEnabled,
    setCloudSyncEnabled,
    lastCloudSync,
    isCloudConnected: isAuthenticated && isOnline,
    syncStatus
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
