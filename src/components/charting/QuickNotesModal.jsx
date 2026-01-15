import { useState, useEffect, useRef } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import './QuickNotesModal.css';

/**
 * Quick Notes Modal - Per-patient notes
 * Structure matches HDFlowsheet reference exactly (index.html lines 14719-14737)
 */
const QuickNotesModal = ({ isOpen, onClose, patientId }) => {
  const { patients, updatePatient } = usePatients();
  const [notesText, setNotesText] = useState('');
  const textareaRef = useRef(null);

  // Get the active patient
  const patient = patients.find(p => p.id === patientId);

  // Load patient's notes when modal opens or patient changes
  useEffect(() => {
    if (isOpen && patient) {
      setNotesText(patient.quickNotes || '');
      // Focus textarea after modal opens
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, patient]);

  // Save notes to patient
  const saveQuickNotes = () => {
    if (patient) {
      updatePatient(patient.id, { quickNotes: notesText });
      onClose();
    }
  };

  // Handle close without saving (could add confirmation)
  const handleClose = () => {
    onClose();
  };

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('quick-notes-overlay')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`quick-notes-overlay ${isOpen ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="quick-notes-modal">
        <div className="quick-notes-header">
          <div>
            <div className="quick-notes-title">📝 Quick Notes</div>
            <div className="quick-notes-patient">
              {patient ? `${patient.name} - Chair ${patient.chair || 'N/A'}` : 'No Patient Selected'}
            </div>
          </div>
          <button className="quick-notes-close" onClick={handleClose}>×</button>
        </div>
        <div className="quick-notes-body">
          <textarea
            ref={textareaRef}
            className="quick-notes-textarea"
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder={`Jot down notes for this patient...

Examples:
• Patient requested early pickup
• Family member called - update contact info
• Check lab results next visit
• Access site looks irritated - monitor`}
          />
        </div>
        <div className="quick-notes-footer">
          <span className="quick-notes-hint">💡 Notes are saved per patient</span>
          <button className="quick-notes-save" onClick={saveQuickNotes}>
            💾 Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickNotesModal;
