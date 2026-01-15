import { useState, useMemo } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import { useTheme } from '../../contexts/ThemeContext';
import './QuickAssignModal.css';

const QuickAssignModal = ({ isOpen, onClose }) => {
  const patientContext = usePatients();
  const themeContext = useTheme();

  // Defensive destructuring with fallbacks
  const patients = patientContext?.patients || [];
  const getFilteredPatients = patientContext?.getFilteredPatients || (() => []);
  const updatePatient = patientContext?.updatePatient || (() => {});
  const sections = patientContext?.sections || {};
  const technicians = themeContext?.technicians || [];

  const [selectedPatients, setSelectedPatients] = useState(new Set());
  const [assignTech, setAssignTech] = useState('');
  const [assignChair, setAssignChair] = useState('');
  const [assignPod, setAssignPod] = useState('');
  const [assignSection, setAssignSection] = useState('');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure filteredPatients is always an array
  const filteredPatients = getFilteredPatients() || [];

  // Filter patients based on search and unassigned filter
  const displayPatients = useMemo(() => {
    let result = Array.isArray(filteredPatients) ? filteredPatients : [];

    if (filterUnassigned) {
      result = result.filter(p => !p.tech || !p.chair);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.tech?.toLowerCase().includes(term) ||
        p.pod?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [filteredPatients, filterUnassigned, searchTerm]);

  // Get available chairs (1-36)
  const allChairs = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => i + 1);
  }, []);

  // Get chairs that are already assigned
  const assignedChairs = useMemo(() => {
    return new Set(filteredPatients.map(p => p.chair).filter(Boolean));
  }, [filteredPatients]);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedPatients.size === displayPatients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(displayPatients.map(p => p.id)));
    }
  };

  const handleSelectPatient = (patientId) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const handleAssignTech = () => {
    if (!assignTech || selectedPatients.size === 0) return;

    try {
      const patientIds = Array.from(selectedPatients);
      patientIds.forEach(patientId => {
        updatePatient(patientId, { tech: assignTech });
      });

      setSelectedPatients(new Set());
      setAssignTech('');
    } catch (error) {
      console.error('Error assigning technician:', error);
    }
  };

  const handleAssignChairs = () => {
    if (selectedPatients.size === 0) return;

    // Get available chairs for sequential assignment
    const availableChairs = allChairs.filter(c => !assignedChairs.has(c));
    const selectedArray = Array.from(selectedPatients);

    selectedArray.forEach((patientId, index) => {
      if (assignChair) {
        // Assign specific chair to first selected patient
        if (index === 0) {
          updatePatient(patientId, { chair: parseInt(assignChair) });
        }
      } else if (availableChairs[index]) {
        // Auto-assign next available chair
        updatePatient(patientId, { chair: availableChairs[index] });
      }
    });

    setSelectedPatients(new Set());
    setAssignChair('');
  };

  const handleAssignPod = () => {
    if (!assignPod || selectedPatients.size === 0) return;

    try {
      const patientIds = Array.from(selectedPatients);
      patientIds.forEach(patientId => {
        updatePatient(patientId, { pod: assignPod });
      });

      setSelectedPatients(new Set());
      setAssignPod('');
    } catch (error) {
      console.error('Error assigning pod:', error);
    }
  };

  const handleAssignSection = () => {
    if (!assignSection || selectedPatients.size === 0) return;

    try {
      const patientIds = Array.from(selectedPatients);
      patientIds.forEach(patientId => {
        updatePatient(patientId, { section: assignSection });
      });

      setSelectedPatients(new Set());
      setAssignSection('');
    } catch (error) {
      console.error('Error assigning section:', error);
    }
  };

  const handleClearAssignments = () => {
    if (selectedPatients.size === 0) return;
    if (!confirm('Clear tech and chair assignments for selected patients?')) return;

    try {
      const patientIds = Array.from(selectedPatients);
      patientIds.forEach(patientId => {
        updatePatient(patientId, { tech: '', chair: null });
      });

      setSelectedPatients(new Set());
    } catch (error) {
      console.error('Error clearing assignments:', error);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get unique pods from patients
  const existingPods = useMemo(() => {
    const pods = new Set(filteredPatients.map(p => p.pod).filter(Boolean));
    return Array.from(pods).sort();
  }, [filteredPatients]);

  return (
    <div className="quick-assign-overlay" onClick={handleOverlayClick}>
      <div className="quick-assign-modal">
        <div className="quick-assign-header">
          <h2>Quick Assign</h2>
          <p className="quick-assign-subtitle">
            Bulk assign technicians, chairs, and pods to patients
          </p>
          <button className="quick-assign-close" onClick={onClose}>×</button>
        </div>

        <div className="quick-assign-body">
          {/* Assignment Controls */}
          <div className="assign-controls">
            <div className="assign-group">
              <label>Assign Technician</label>
              <div className="assign-row">
                <select
                  value={assignTech}
                  onChange={(e) => setAssignTech(e.target.value)}
                >
                  <option value="">Select Tech...</option>
                  {(technicians || []).map((tech, idx) => (
                    <option key={idx} value={tech?.name || ''}>
                      {tech?.name || 'Unknown'}{tech?.pod ? ` (Pod ${tech.pod})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="assign-btn"
                  onClick={handleAssignTech}
                  disabled={!assignTech || selectedPatients.size === 0}
                >
                  Assign Tech
                </button>
              </div>
            </div>

            <div className="assign-group">
              <label>Assign Chair</label>
              <div className="assign-row">
                <select
                  value={assignChair}
                  onChange={(e) => setAssignChair(e.target.value)}
                >
                  <option value="">Auto-assign next...</option>
                  {allChairs.map(chair => (
                    <option
                      key={chair}
                      value={chair}
                      disabled={assignedChairs.has(chair)}
                    >
                      Chair {chair} {assignedChairs.has(chair) ? '(taken)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="assign-btn"
                  onClick={handleAssignChairs}
                  disabled={selectedPatients.size === 0}
                >
                  {assignChair ? 'Assign Chair' : 'Auto-Assign'}
                </button>
              </div>
            </div>

            <div className="assign-group">
              <label>Assign Pod</label>
              <div className="assign-row">
                <input
                  type="text"
                  value={assignPod}
                  onChange={(e) => setAssignPod(e.target.value)}
                  placeholder="Enter pod (e.g., A, B, C)"
                  list="pod-suggestions"
                />
                <datalist id="pod-suggestions">
                  {existingPods.map(pod => (
                    <option key={pod} value={pod} />
                  ))}
                </datalist>
                <button
                  className="assign-btn"
                  onClick={handleAssignPod}
                  disabled={!assignPod || selectedPatients.size === 0}
                >
                  Assign Pod
                </button>
              </div>
            </div>

            <div className="assign-group">
              <label>Assign Section</label>
              <div className="assign-row">
                <select
                  value={assignSection}
                  onChange={(e) => setAssignSection(e.target.value)}
                >
                  <option value="">Select Section...</option>
                  {Object.keys(sections || {}).map(section => {
                    const sectionData = sections[section];
                    const chairs = sectionData?.chairs || [];
                    const chairRange = chairs.length > 0
                      ? `(Chairs ${chairs[0]}-${chairs[chairs.length - 1]})`
                      : '';
                    return (
                      <option key={section} value={section}>
                        {section} {chairRange}
                      </option>
                    );
                  })}
                </select>
                <button
                  className="assign-btn"
                  onClick={handleAssignSection}
                  disabled={!assignSection || selectedPatients.size === 0}
                >
                  Assign Section
                </button>
              </div>
            </div>

            <button
              className="clear-assign-btn"
              onClick={handleClearAssignments}
              disabled={selectedPatients.size === 0}
            >
              Clear Assignments for Selected
            </button>
          </div>

          {/* Filters */}
          <div className="patient-filters">
            <input
              type="text"
              className="search-input"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filterUnassigned}
                onChange={(e) => setFilterUnassigned(e.target.checked)}
              />
              Show unassigned only
            </label>
          </div>

          {/* Patient List */}
          <div className="patient-list-header">
            <label className="select-all">
              <input
                type="checkbox"
                checked={selectedPatients.size === displayPatients.length && displayPatients.length > 0}
                onChange={handleSelectAll}
              />
              Select All ({selectedPatients.size} selected)
            </label>
          </div>

          <div className="patient-list">
            {displayPatients.length === 0 ? (
              <div className="no-patients">
                {filterUnassigned
                  ? 'All patients are assigned'
                  : 'No patients found'}
              </div>
            ) : (
              displayPatients.map(patient => (
                <div
                  key={patient.id}
                  className={`patient-row ${selectedPatients.has(patient.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectPatient(patient.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedPatients.has(patient.id)}
                    onChange={() => handleSelectPatient(patient.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="patient-row-info">
                    <span className="patient-row-name">{patient.name || 'Unnamed'}</span>
                    <div className="patient-row-details">
                      {patient.chair ? (
                        <span className="detail-badge chair">Chair {patient.chair}</span>
                      ) : (
                        <span className="detail-badge unassigned">No Chair</span>
                      )}
                      {patient.tech ? (
                        <span className="detail-badge tech">{patient.tech}</span>
                      ) : (
                        <span className="detail-badge unassigned">No Tech</span>
                      )}
                      {patient.pod && (
                        <span className="detail-badge pod">Pod {patient.pod}</span>
                      )}
                      {patient.section && (
                        <span className="detail-badge section">{patient.section}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="quick-assign-footer">
          <span className="footer-info">
            {filteredPatients?.length || 0} patients in shift |{' '}
            {filteredPatients?.filter(p => p?.tech).length || 0} assigned techs |{' '}
            {filteredPatients?.filter(p => p?.chair).length || 0} assigned chairs
          </span>
          <button className="done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default QuickAssignModal;
