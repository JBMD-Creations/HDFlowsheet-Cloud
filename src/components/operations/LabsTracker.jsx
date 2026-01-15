import { useState } from 'react';
import { useOperations } from '../../contexts/OperationsContext';
import { format } from 'date-fns';
import './LabsTracker.css';

const LabsTracker = () => {
  const { labs, addLab, deleteLab, clearAllLabs } = useOperations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [timestamp, setTimestamp] = useState('');

  const handleAddLab = (e) => {
    e.preventDefault();
    if (patientName.trim()) {
      addLab(patientName.trim(), timestamp || new Date().toISOString());
      setPatientName('');
      setTimestamp('');
      setShowAddForm(false);
    }
  };

  const handleDeleteLab = (labId) => {
    if (window.confirm('Are you sure you want to remove this lab entry?')) {
      deleteLab(labId);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all lab entries? This cannot be undone.')) {
      clearAllLabs();
    }
  };

  const formatLabTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return format(date, 'h:mm a');
    } catch (e) {
      return 'Invalid time';
    }
  };

  const formatLabDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Group labs by date
  const groupedLabs = labs.reduce((groups, lab) => {
    const date = formatLabDate(lab.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(lab);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedLabs).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  return (
    <div className="labs-tracker">
      <div className="labs-header">
        <div>
          <h2>Labs Tracker</h2>
          <p className="labs-subtitle">
            Track lab collection times and patient specimens
          </p>
        </div>
        <div className="labs-actions">
          {labs.length > 0 && (
            <button
              className="clear-all-btn"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
          <button
            className="add-lab-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Lab'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddLab} className="add-lab-form">
          <div className="form-row">
            <div className="form-group">
              <label>Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="lab-input"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Collection Time (Optional)</label>
              <input
                type="datetime-local"
                value={timestamp ? new Date(timestamp).toISOString().slice(0, 16) : ''}
                onChange={(e) => setTimestamp(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="lab-input"
              />
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <button type="submit" className="submit-lab-btn">
                Add Lab
              </button>
            </div>
          </div>
          <p className="form-hint">
            💡 Leave time empty to use current time
          </p>
        </form>
      )}

      {labs.length === 0 ? (
        <div className="labs-empty">
          <div className="empty-icon">🧪</div>
          <h3>No Lab Entries</h3>
          <p>Add your first lab collection to get started</p>
        </div>
      ) : (
        <div className="labs-list">
          <div className="labs-stats">
            <div className="stat-card">
              <span className="stat-value">{labs.length}</span>
              <span className="stat-label">Total Labs</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{sortedDates.length}</span>
              <span className="stat-label">Days Tracked</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {sortedDates[0] && groupedLabs[sortedDates[0]]?.length || 0}
              </span>
              <span className="stat-label">Today's Labs</span>
            </div>
          </div>

          {sortedDates.map(date => (
            <div key={date} className="lab-date-group">
              <div className="lab-date-header">
                <h3>{date}</h3>
                <span className="lab-count">{groupedLabs[date].length} labs</span>
              </div>
              <div className="lab-entries">
                {groupedLabs[date].map((lab, index) => (
                  <div key={lab.id} className="lab-entry">
                    <div className="lab-number">{index + 1}</div>
                    <div className="lab-info">
                      <span className="lab-patient">{lab.patientName}</span>
                      <span className="lab-time">🕐 {formatLabTime(lab.timestamp)}</span>
                    </div>
                    <button
                      className="delete-lab-btn"
                      onClick={() => handleDeleteLab(lab.id)}
                      aria-label="Delete lab"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabsTracker;
