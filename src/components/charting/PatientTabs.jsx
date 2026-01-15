import { useRef, useEffect } from 'react';
import './PatientTabs.css';

const PatientTabs = ({ patients, activePatientId, onPatientSelect, onAddPatient }) => {
  const tabsRef = useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activePatientId && tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('.patient-tab.active');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activePatientId]);

  // Get status indicators for a patient
  const getStatusBadges = (patient) => {
    const badges = [];

    // Weight deviation (over 1.5kg from dry weight)
    if (patient.preWeight && patient.dryWeight) {
      const deviation = Math.abs(patient.preWeight - patient.dryWeight);
      if (deviation > 1.5) {
        badges.push({ icon: '⚖️', label: 'Weight', color: '#ef4444' });
      }
    }

    // Time short (treatment less than prescribed)
    if (patient.eosr?.earlyTermination?.is) {
      badges.push({ icon: '⏱️', label: 'Short', color: '#f59e0b' });
    }

    // ETT needed
    if (!patient.qa?.ettSigned && patient.qa?.chartClosed === false) {
      badges.push({ icon: '✍️', label: 'ETT', color: '#8b5cf6' });
    }

    // Hospitalized
    if (patient.hospitalized?.isHosp) {
      badges.push({ icon: '🏥', label: 'Hosp', color: '#eab308', bgColor: '#fef3c7' });
    }

    // Missed Tx
    if (patient.missedTx?.isMissed || patient.qa?.missedTx) {
      badges.push({ icon: '❌', label: 'Missed', color: '#dc2626', bgColor: '#fee2e2' });
    }

    // Chart Closed
    if (patient.qa?.chartClosed) {
      badges.push({ icon: '✅', label: 'Closed', color: '#22c55e' });
    }

    return badges;
  };

  // Get incomplete todo count
  const getIncompleteTodoCount = (patient) => {
    const todos = patient.miscTodos || [];
    return todos.filter(t => !t.completed).length;
  };

  return (
    <div className="patient-tabs-wrapper">
      <div className="patient-tabs-container" ref={tabsRef}>
        <div className="patient-tabs">
          {patients.map((patient, index) => {
            const badges = getStatusBadges(patient);
            const todoCount = getIncompleteTodoCount(patient);
            const isActive = patient.id === activePatientId;
            const isChartClosed = patient.qa?.chartClosed;

            return (
              <button
                key={patient.id}
                className={`patient-tab ${isActive ? 'active' : ''} ${isChartClosed ? 'chart-closed' : ''}`}
                onClick={() => onPatientSelect(patient.id)}
              >
                <span className="patient-tab-name">
                  {patient.name || `Patient ${index + 1}`}
                </span>
                {patient.chair && (
                  <span className="patient-tab-chair">#{patient.chair}</span>
                )}
                <div className="patient-tab-badges">
                  {badges.map((badge, i) => (
                    <span
                      key={i}
                      className="patient-tab-badge"
                      style={{
                        color: badge.color,
                        backgroundColor: badge.bgColor || 'transparent'
                      }}
                      title={badge.label}
                    >
                      {badge.icon}
                    </span>
                  ))}
                  {todoCount > 0 && (
                    <span className="patient-tab-todo-count">{todoCount}</span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Add Patient Button */}
          <button
            className="patient-tab add-patient-tab"
            onClick={onAddPatient}
          >
            <span className="add-icon">+</span>
            <span className="add-text">Add</span>
          </button>
        </div>
      </div>

      {/* Scroll indicators */}
      {patients.length > 5 && (
        <div className="scroll-hint">← Scroll for more →</div>
      )}
    </div>
  );
};

export default PatientTabs;
