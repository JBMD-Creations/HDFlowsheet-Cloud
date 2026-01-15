import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSave } from '../../contexts/SaveContext';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, setTheme, themes, technicians, addTechnician, removeTechnician, clearAllTechnicians } = useTheme();
  const {
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval,
    lastSaved,
    exportAllData,
    clearAllData,
    saveAll
  } = useSave();
  const [newTechName, setNewTechName] = useState('');
  const [newTechPod, setNewTechPod] = useState('');
  const [activeTab, setActiveTab] = useState('theme');

  if (!isOpen) return null;

  const handleAddTechnician = (e) => {
    e.preventDefault();
    if (newTechName.trim() && newTechPod.trim()) {
      addTechnician(newTechName.trim(), newTechPod.trim());
      setNewTechName('');
      setNewTechPod('');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            Theme
          </button>
          <button
            className={`settings-tab ${activeTab === 'technicians' ? 'active' : ''}`}
            onClick={() => setActiveTab('technicians')}
          >
            Technicians
          </button>
          <button
            className={`settings-tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'theme' && (
            <div className="settings-section">
              <h3>Choose Theme</h3>
              <p className="settings-description">
                Select a color theme for the application
              </p>
              <div className="theme-selector">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    className={`theme-option ${theme === themeOption.value ? 'active' : ''}`}
                    onClick={() => setTheme(themeOption.value)}
                  >
                    <span className={`theme-preview theme-preview-${themeOption.value}`}></span>
                    <span className="theme-label">{themeOption.label}</span>
                    {theme === themeOption.value && (
                      <span className="theme-checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'technicians' && (
            <div className="settings-section">
              <h3>Manage Technicians</h3>
              <p className="settings-description">
                Add or remove technicians and assign them to pods
              </p>

              <form onSubmit={handleAddTechnician} className="tech-form">
                <div className="tech-form-row">
                  <input
                    type="text"
                    placeholder="Technician Name"
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    className="tech-input"
                  />
                  <input
                    type="text"
                    placeholder="Pod (e.g., A, B, C)"
                    value={newTechPod}
                    onChange={(e) => setNewTechPod(e.target.value)}
                    className="tech-input"
                  />
                  <button type="submit" className="tech-add-btn">
                    Add
                  </button>
                </div>
              </form>

              {technicians.length > 0 ? (
                <>
                  <div className="tech-list">
                    {technicians.map((tech, index) => (
                      <div key={index} className="tech-item">
                        <div className="tech-info">
                          <span className="tech-name">{tech.name}</span>
                          <span className="tech-pod">Pod {tech.pod}</span>
                        </div>
                        <button
                          className="tech-remove-btn"
                          onClick={() => removeTechnician(tech.name)}
                          aria-label={`Remove ${tech.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="tech-clear-all-btn"
                    onClick={clearAllTechnicians}
                  >
                    Clear All Technicians
                  </button>
                </>
              ) : (
                <div className="tech-empty">
                  <p>No technicians added yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="settings-section">
              <h3>Auto-Save Settings</h3>
              <p className="settings-description">
                Configure automatic saving of your data
              </p>

              <div className="data-settings">
                <label className="toggle-setting">
                  <span className="toggle-label">Enable Auto-Save</span>
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="toggle-input"
                  />
                  <span className="toggle-switch"></span>
                </label>

                <div className="interval-setting">
                  <label htmlFor="autosave-interval">Auto-Save Interval</label>
                  <select
                    id="autosave-interval"
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                    disabled={!autoSaveEnabled}
                  >
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={120000}>2 minutes</option>
                    <option value={300000}>5 minutes</option>
                  </select>
                </div>

                {lastSaved && (
                  <p className="last-saved-info">
                    Last saved: {lastSaved.toLocaleString()}
                  </p>
                )}
              </div>

              <h3 style={{ marginTop: '24px' }}>Data Management</h3>
              <p className="settings-description">
                Export or clear your data
              </p>

              <div className="data-actions">
                <button className="data-action-btn save-now-btn" onClick={saveAll}>
                  💾 Save Now
                </button>
                <button className="data-action-btn export-btn" onClick={exportAllData}>
                  📤 Export All Data
                </button>
                <button className="data-action-btn danger-btn" onClick={clearAllData}>
                  🗑️ Clear All Data
                </button>
              </div>

              <div className="data-info">
                <p><strong>Note:</strong> Your data is stored locally in your browser.
                   Use "Export All Data" to create a backup file.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
