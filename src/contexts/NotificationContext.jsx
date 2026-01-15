import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { usePatients } from './PatientContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification types
const NOTIFICATION_TYPES = {
  WEIGHT_DEVIATION: 'weight_deviation',
  INCOMPLETE_QA: 'incomplete_qa',
  STAT_LABS: 'stat_labs',
  MISSED_TREATMENT: 'missed_treatment',
  EARLY_TERMINATION: 'early_termination',
  NO_TECH_ASSIGNED: 'no_tech_assigned',
  HOSPITALIZED: 'hospitalized',
  PENDING_TODOS: 'pending_todos'
};

// Alert severity levels
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

export const NotificationProvider = ({ children }) => {
  const { patients, getFilteredPatients, activeShift } = usePatients();
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    const saved = localStorage.getItem('hd-dismissed-alerts');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Persist dismissed alerts
  useEffect(() => {
    localStorage.setItem('hd-dismissed-alerts', JSON.stringify(dismissedAlerts));
  }, [dismissedAlerts]);

  // Clear old dismissed alerts (older than 24 hours)
  useEffect(() => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    setDismissedAlerts(prev =>
      prev.filter(alert => now - alert.dismissedAt < twentyFourHours)
    );
  }, []);

  // Generate alerts from patient data
  const alerts = useMemo(() => {
    const filteredPatients = getFilteredPatients();
    const generatedAlerts = [];

    filteredPatients.forEach(patient => {
      const patientName = patient.name || 'Unknown Patient';
      const chairInfo = patient.chair ? `Chair ${patient.chair}` : '';

      // Weight deviation alert (>1.5kg from dry weight)
      if (patient.preWeight && patient.dryWeight) {
        const deviation = Math.abs(patient.preWeight - patient.dryWeight);
        if (deviation > 1.5) {
          generatedAlerts.push({
            id: `weight_${patient.id}`,
            type: NOTIFICATION_TYPES.WEIGHT_DEVIATION,
            severity: deviation > 3 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
            patientId: patient.id,
            patientName,
            chairInfo,
            title: 'Weight Deviation',
            message: `${patientName} is ${deviation.toFixed(1)}kg ${patient.preWeight > patient.dryWeight ? 'above' : 'below'} dry weight`,
            details: `Pre: ${patient.preWeight}kg, Dry: ${patient.dryWeight}kg`,
            icon: '⚖️'
          });
        }
      }

      // Incomplete QA checklist alert
      const qaItems = patient.qa || {};
      const criticalQA = ['preCheck', 'thirtyMin', 'meds', 'ettSigned', 'chartClosed'];
      const incompleteQA = criticalQA.filter(item => !qaItems[item]);

      if (incompleteQA.length > 0 && !qaItems.chartClosed) {
        generatedAlerts.push({
          id: `qa_${patient.id}`,
          type: NOTIFICATION_TYPES.INCOMPLETE_QA,
          severity: incompleteQA.length > 3 ? SEVERITY.WARNING : SEVERITY.INFO,
          patientId: patient.id,
          patientName,
          chairInfo,
          title: 'Incomplete QA',
          message: `${patientName} has ${incompleteQA.length} incomplete QA items`,
          details: `Missing: ${incompleteQA.join(', ')}`,
          icon: '📋'
        });
      }

      // STAT Labs ordered alert
      if (qaItems.statLabs || patient.eosr?.statLabs?.length > 0) {
        generatedAlerts.push({
          id: `labs_${patient.id}`,
          type: NOTIFICATION_TYPES.STAT_LABS,
          severity: SEVERITY.WARNING,
          patientId: patient.id,
          patientName,
          chairInfo,
          title: 'STAT Labs',
          message: `${patientName} has STAT labs ordered`,
          details: patient.eosr?.statLabs?.join(', ') || 'Labs pending',
          icon: '🧪'
        });
      }

      // Missed treatment alert
      if (patient.missedTx?.isMissed || patient.missedTx?.count > 0) {
        generatedAlerts.push({
          id: `missed_${patient.id}`,
          type: NOTIFICATION_TYPES.MISSED_TREATMENT,
          severity: SEVERITY.CRITICAL,
          patientId: patient.id,
          patientName,
          chairInfo,
          title: 'Missed Treatment',
          message: `${patientName} has a missed treatment`,
          details: patient.missedTx.reason || 'No reason provided',
          icon: '❌'
        });
      }

      // Early termination alert
      if (patient.eosr?.earlyTermination?.is) {
        generatedAlerts.push({
          id: `early_${patient.id}`,
          type: NOTIFICATION_TYPES.EARLY_TERMINATION,
          severity: patient.eosr.earlyTermination.minutes > 30 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
          patientId: patient.id,
          patientName,
          chairInfo,
          title: 'Early Termination',
          message: `${patientName} terminated ${patient.eosr.earlyTermination.minutes} minutes early`,
          details: patient.eosr.earlyTermination.reason || 'No reason provided',
          icon: '⏱️'
        });
      }

      // No technician assigned alert
      if (!patient.tech || patient.tech.trim() === '') {
        generatedAlerts.push({
          id: `tech_${patient.id}`,
          type: NOTIFICATION_TYPES.NO_TECH_ASSIGNED,
          severity: SEVERITY.INFO,
          patientId: patient.id,
          patientName,
          chairInfo,
          title: 'No Tech Assigned',
          message: `${patientName} has no technician assigned`,
          details: 'Assign a technician in patient details',
          icon: '👤'
        });
      }

      // Hospitalized patient alert
      if (patient.hospitalized?.isHosp) {
        generatedAlerts.push({
          id: `hosp_${patient.id}`,
          type: NOTIFICATION_TYPES.HOSPITALIZED,
          severity: SEVERITY.WARNING,
          patientId: patient.id,
          patientName,
          chairInfo,
          title: 'Hospitalized',
          message: `${patientName} is hospitalized`,
          details: `${patient.hospitalized.hospital || 'Unknown hospital'}${patient.hospitalized.days ? ` (Day ${patient.hospitalized.days})` : ''}`,
          icon: '🏥'
        });
      }

      // Pending todos alert
      const pendingTodos = (patient.miscTodos || []).filter(t => !t.completed);
      if (pendingTodos.length > 0) {
        generatedAlerts.push({
          id: `todos_${patient.id}`,
          type: NOTIFICATION_TYPES.PENDING_TODOS,
          severity: pendingTodos.length > 3 ? SEVERITY.WARNING : SEVERITY.INFO,
          patientId: patient.id,
          patientName,
          chairInfo,
          title: 'Pending Tasks',
          message: `${patientName} has ${pendingTodos.length} pending task${pendingTodos.length > 1 ? 's' : ''}`,
          details: pendingTodos.slice(0, 3).map(t => t.text).join(', '),
          icon: '📝'
        });
      }
    });

    // Sort by severity (critical first, then warning, then info)
    const severityOrder = { [SEVERITY.CRITICAL]: 0, [SEVERITY.WARNING]: 1, [SEVERITY.INFO]: 2 };
    return generatedAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [getFilteredPatients]);

  // Filter out dismissed alerts
  const activeAlerts = useMemo(() => {
    const dismissedIds = new Set(dismissedAlerts.map(a => a.id));
    return alerts.filter(alert => !dismissedIds.has(alert.id));
  }, [alerts, dismissedAlerts]);

  // Get alerts by type
  const getAlertsByType = useCallback((type) => {
    return activeAlerts.filter(alert => alert.type === type);
  }, [activeAlerts]);

  // Get alerts by severity
  const getAlertsBySeverity = useCallback((severity) => {
    return activeAlerts.filter(alert => alert.severity === severity);
  }, [activeAlerts]);

  // Get alerts for a specific patient
  const getAlertsForPatient = useCallback((patientId) => {
    return activeAlerts.filter(alert => alert.patientId === patientId);
  }, [activeAlerts]);

  // Dismiss an alert
  const dismissAlert = useCallback((alertId) => {
    setDismissedAlerts(prev => [
      ...prev,
      { id: alertId, dismissedAt: Date.now() }
    ]);
  }, []);

  // Dismiss all alerts
  const dismissAllAlerts = useCallback(() => {
    setDismissedAlerts(prev => [
      ...prev,
      ...activeAlerts.map(alert => ({ id: alert.id, dismissedAt: Date.now() }))
    ]);
  }, [activeAlerts]);

  // Clear all dismissals
  const clearDismissals = useCallback(() => {
    setDismissedAlerts([]);
  }, []);

  // Summary counts
  const summary = useMemo(() => ({
    total: activeAlerts.length,
    critical: activeAlerts.filter(a => a.severity === SEVERITY.CRITICAL).length,
    warning: activeAlerts.filter(a => a.severity === SEVERITY.WARNING).length,
    info: activeAlerts.filter(a => a.severity === SEVERITY.INFO).length
  }), [activeAlerts]);

  const value = {
    alerts: activeAlerts,
    allAlerts: alerts,
    summary,
    NOTIFICATION_TYPES,
    SEVERITY,
    showNotificationPanel,
    setShowNotificationPanel,
    getAlertsByType,
    getAlertsBySeverity,
    getAlertsForPatient,
    dismissAlert,
    dismissAllAlerts,
    clearDismissals
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
