import { useState } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import { useTheme } from '../../contexts/ThemeContext';

const AddPatientModal = ({ onClose, onPatientAdded }) => {
  const { addPatient, activeShift, currentSection, sections } = usePatients();
  const { technicians } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    chair: '',
    tech: '',
    pod: '',
    section: currentSection,
    shift: activeShift,
    dryWeight: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill pod when tech is selected
    if (field === 'tech') {
      const tech = technicians.find(t => t.name === value);
      if (tech) {
        setFormData(prev => ({ ...prev, pod: tech.pod }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a patient name');
      return;
    }

    const newPatient = addPatient({
      ...formData,
      chair: formData.chair ? parseInt(formData.chair) : null,
      dryWeight: formData.dryWeight ? parseFloat(formData.dryWeight) : null
    });

    // Notify parent of the new patient ID so it can be selected
    if (onPatientAdded && newPatient?.id) {
      onPatientAdded(newPatient.id);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Patient</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Patient Name (Initials) *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., J.D."
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Chair #</label>
              <input
                type="number"
                value={formData.chair}
                onChange={(e) => handleChange('chair', e.target.value)}
                placeholder="1-36"
                min="1"
                max="36"
              />
            </div>

            <div className="form-group">
              <label>Section</label>
              <select
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
              >
                {Object.keys(sections).map(sectionKey => (
                  <option key={sectionKey} value={sectionKey}>
                    {sections[sectionKey].name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => handleChange('shift', e.target.value)}
              >
                <option value="1st">1st Shift</option>
                <option value="2nd">2nd Shift</option>
                <option value="3rd">3rd Shift</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Technician</label>
              <select
                value={formData.tech}
                onChange={(e) => handleChange('tech', e.target.value)}
              >
                <option value="">Select Tech</option>
                {technicians.map(tech => (
                  <option key={tech.name} value={tech.name}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pod</label>
              <input
                type="text"
                value={formData.pod}
                onChange={(e) => handleChange('pod', e.target.value)}
                placeholder="Auto-filled or manual"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Dry Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.dryWeight}
              onChange={(e) => handleChange('dryWeight', e.target.value)}
              placeholder="0.0"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
