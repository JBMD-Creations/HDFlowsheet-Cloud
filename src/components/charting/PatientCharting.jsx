import { useState, useEffect } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSave } from '../../contexts/SaveContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import PatientTabs from './PatientTabs';
import FullPatientChart from './FullPatientChart';
import AddPatientModal from './AddPatientModal';
import ExcelImportModal from './ExcelImportModal';
import SnippetsSidePanel from './SnippetsSidePanel';
import QuickAssignModal from './QuickAssignModal';
import QuickNotesModal from './QuickNotesModal';
import { RealtimeCursors } from '../realtime-cursors';
import './PatientCharting.css';

const PatientCharting = () => {
  const { patients, getFilteredPatients, activeShift, setActiveShift, isCloudConnected } = usePatients();
  const { technicians } = useTheme();
  const { saveAll, saveStatus, SAVE_STATUS, lastSaved, autoSaveEnabled } = useSave();
  const { summary: alertSummary, setShowNotificationPanel } = useNotifications();
  const { user, isAuthenticated } = useAuth();

  // Get username for realtime cursors
  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);

  // Active patient tracking - this is KEY for Quick Notes and tabs
  const [activePatientId, setActivePatientId] = useState(null);

  const filteredPatients = getFilteredPatients();

  // Auto-select first patient when list changes or on initial load
  useEffect(() => {
    if (filteredPatients.length > 0) {
      // If current active patient is not in filtered list, select first
      const activeExists = filteredPatients.some(p => p.id === activePatientId);
      if (!activePatientId || !activeExists) {
        setActivePatientId(filteredPatients[0].id);
      }
    } else {
      setActivePatientId(null);
    }
  }, [filteredPatients, activePatientId]);

  // Get the currently active patient
  const activePatient = filteredPatients.find(p => p.id === activePatientId);

  // Get alert button class based on severity
  const getAlertButtonClass = () => {
    if (alertSummary.critical > 0) return 'alert-btn has-critical';
    if (alertSummary.warning > 0) return 'alert-btn has-warning';
    if (alertSummary.info > 0) return 'alert-btn has-info';
    return 'alert-btn no-alerts';
  };

  // Get save button text and class based on status
  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case SAVE_STATUS.SAVING:
        return { text: '⏳ Saving...', className: 'saving' };
      case SAVE_STATUS.SAVED:
        return { text: '✓ Saved!', className: 'saved' };
      case SAVE_STATUS.ERROR:
        return { text: '❌ Error', className: 'error' };
      default:
        return { text: '💾 Save All', className: '' };
    }
  };

  const saveButton = getSaveButtonContent();

  // Open Quick Notes for active patient
  const openQuickNotes = () => {
    if (activePatientId) {
      setShowQuickNotes(true);
    }
  };

  // Handle patient added - select the new patient
  const handlePatientAdded = (newPatientId) => {
    setShowAddModal(false);
    if (newPatientId) {
      setActivePatientId(newPatientId);
    }
  };

  // Calculate stats for shift overview
  const chartClosedCount = filteredPatients.filter(p => p.qa?.chartClosed).length;
  const unassignedCount = filteredPatients.filter(p => !p.tech || !p.chair).length;

  return (
    <div className="pt-charting-page active">
      {/* Shift Overview Header */}
      <div className="shift-overview">
        <h2>📊 Shift Overview</h2>
        <div className="shift-stats">
          <div className="stat-card blue">
            <span className="stat-label">Total Patients</span>
            <span className="stat-value">{filteredPatients.length}</span>
          </div>
          <div className="stat-card red">
            <span className="stat-label">Time Alerts</span>
            <span className="stat-value">{alertSummary.warning || 0}</span>
          </div>
          <div className="stat-card orange">
            <span className="stat-label">Weight Alerts</span>
            <span className="stat-value">{alertSummary.critical || 0}</span>
          </div>
          <div className="stat-card green">
            <span className="stat-label">Complete</span>
            <span className="stat-value">{chartClosedCount}/{filteredPatients.length}</span>
          </div>
        </div>
      </div>

      {/* Shift Tabs */}
      <div className="shift-tabs">
        <span className="shift-label">Shift:</span>
        {['1st', '2nd'].map(shift => (
          <button
            key={shift}
            className={`shift-tab ${activeShift === shift ? 'active' : ''}`}
            onClick={() => setActiveShift(shift)}
          >
            {shift}
            <span className="shift-count">
              {patients.filter(p => p.shift === shift || !p.shift).length}
            </span>
          </button>
        ))}
      </div>

      {/* Unassigned Warning */}
      {unassignedCount > 0 && (
        <div className="unassigned-warning">
          <span className="warning-icon">⚠️</span>
          <span>Unassigned:</span>
          <span className="warning-count">{unassignedCount} pts</span>
          <span className="warning-alert">⚠ 1</span>
        </div>
      )}

      {/* Patient Tabs - One per patient */}
      <PatientTabs
        patients={filteredPatients}
        activePatientId={activePatientId}
        onPatientSelect={setActivePatientId}
        onAddPatient={() => setShowAddModal(true)}
      />

      {/* Full Patient Chart - Shows active patient's full chart */}
      <div className="patient-chart-container">
        {activePatient ? (
          <FullPatientChart
            patient={activePatient}
            onOpenQuickNotes={() => openQuickNotes()}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏥</div>
            <h3>No Patients Yet</h3>
            <p>Click "+ Add" in the tabs above to add your first patient</p>
            <button
              className="add-first-patient-btn"
              onClick={() => setShowAddModal(true)}
            >
              + Add Patient
            </button>
          </div>
        )}
      </div>

      {/* Import/Export Bar */}
      <div className="import-export-bar">
        <button className="action-btn" onClick={() => setShowImportModal(true)}>
          📥 Import/Re-import Patient Orders
        </button>
        <button className="action-btn">
          ☁️ Load from Server
        </button>
        <button className="action-btn">
          📤 Export to File
        </button>
        <button className="action-btn">
          📥 Import from File
        </button>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onPatientAdded={handlePatientAdded}
        />
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Snippets Side Panel (Drawer) */}
      <SnippetsSidePanel
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
      />

      {/* Quick Assign Modal */}
      <QuickAssignModal
        isOpen={showQuickAssign}
        onClose={() => setShowQuickAssign(false)}
      />

      {/* Quick Notes Modal - Uses activePatientId */}
      <QuickNotesModal
        isOpen={showQuickNotes}
        onClose={() => setShowQuickNotes(false)}
        patientId={activePatientId}
      />

      {/* Floating Buttons - Top Right */}
      <div className="floating-buttons">
        <button
          className={`floating-btn ${getAlertButtonClass()}`}
          onClick={() => setShowNotificationPanel(true)}
        >
          🔔 Alerts
          {alertSummary.total > 0 && (
            <span className="notification-badge">{alertSummary.total}</span>
          )}
        </button>
        <button
          className="floating-btn charting-btn"
          onClick={() => setShowSnippets(!showSnippets)}
        >
          📋 Charting
        </button>
        <button
          className="floating-btn"
          onClick={() => setShowQuickAssign(true)}
        >
          👥 Quick Assign
        </button>
        <button
          className="floating-btn"
          onClick={openQuickNotes}
          disabled={!activePatientId}
        >
          📝 Quick Notes
        </button>
        <button
          className={`floating-btn save-btn ${saveButton.className}`}
          onClick={saveAll}
          disabled={saveStatus === SAVE_STATUS.SAVING}
        >
          {saveButton.text}
        </button>
      </div>

      {/* Auto-save indicator - Bottom Left */}
      <div className="autosave-indicator">
        <div className="save-info">
          <span className="save-icon">💾</span>
          <span className="save-label">Save All</span>
          {lastSaved && (
            <span className="last-saved">Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        <label className="autosave-toggle">
          <input type="checkbox" checked={autoSaveEnabled} readOnly />
          Auto-save
        </label>
        {isCloudConnected && (
          <span className="cloud-indicator">☁️ Synced</span>
        )}
        <button className="refresh-btn">🔄 Refresh App</button>
        <button className="hide-btn">▲ Hide</button>
      </div>

      {/* Realtime Cursors - Show team member cursors */}
      {isAuthenticated && (
        <RealtimeCursors
          roomName="charting:main:cursors"
          username={username}
        />
      )}
    </div>
  );
};

export default PatientCharting;
