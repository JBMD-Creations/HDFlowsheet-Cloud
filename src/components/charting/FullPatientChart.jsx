import { useState, useMemo } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import { useTheme } from '../../contexts/ThemeContext';
import './FullPatientChart.css';

// Quick-add todo snippets
const TODO_SNIPPETS = [
  { id: 'access', label: 'Access assessment chart', text: 'Access assessment chart' },
  { id: 'foot', label: 'Foot check', text: 'Foot check' },
  { id: 'monthly', label: 'Monthly progress note', text: 'Monthly progress note' },
  { id: 'daily', label: 'Daily progress note', text: 'Daily progress note' },
  { id: 'notify', label: 'Notify MD/NP', text: 'Notify MD/NP' },
  { id: 'phn', label: 'PHN Call', text: 'PHN Call' },
];

// STAT Labs snippets
const LAB_SNIPPETS = [
  { id: 'hh-post', label: 'H&H - Post Hosp.', text: 'H&H - Post Hosp.' },
  { id: 'bmp-missed', label: 'BMP - 2+ Missed Tx', text: 'BMP - 2+ Missed Tx' },
];

// Tech Check items
const TECH_CHECK_ITEMS = {
  mainFlowsheet: [
    { id: 'initiation', label: 'Initiation Time' },
    { id: 'orderVerify', label: 'Order Verification' },
    { id: 'accessEval', label: 'Access Eval. Time' },
  ],
  dialysisTreatment: [
    { id: 'txInitiated', label: 'Tx Initiated' },
    { id: 'txEnded', label: 'Tx Ended' },
    { id: 'blankVitals', label: 'Blank Vitals Notes' },
  ],
  dialysisMeds: [
    { id: 'heparinBolus', label: 'Heparin Bolus' },
    { id: 'lidocaine', label: 'Lidocaine' },
  ],
  postDialysis: [
    { id: 'postWeight', label: 'Post Weight' },
  ],
};

const FullPatientChart = ({ patient, onOpenQuickNotes }) => {
  const { updatePatient, deletePatient, sections: sectionConfig } = usePatients();
  const { technicians } = useTheme();

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState(patient.collapsedSections || {});
  const [newTodoText, setNewTodoText] = useState('');
  const [newLabText, setNewLabText] = useState('');

  // Handlers
  const handleFieldChange = (field, value) => {
    updatePatient(patient.id, { [field]: value });
  };

  const handleQAChange = (field, value) => {
    updatePatient(patient.id, {
      qa: { ...patient.qa, [field]: value }
    });
  };

  const handleEosrChange = (field, value) => {
    updatePatient(patient.id, {
      eosr: { ...patient.eosr, [field]: value }
    });
  };

  const toggleSection = (sectionId) => {
    const newCollapsed = { ...collapsedSections, [sectionId]: !collapsedSections[sectionId] };
    setCollapsedSections(newCollapsed);
    updatePatient(patient.id, { collapsedSections: newCollapsed });
  };

  // Tech Check handlers
  const techCheck = patient.techCheck || {};
  const handleTechCheckChange = (itemId, value) => {
    updatePatient(patient.id, {
      techCheck: { ...techCheck, [itemId]: value }
    });
  };

  // Misc To-Do handlers
  const miscTodos = patient.miscTodos || [];
  const incompleteTodos = miscTodos.filter(t => !t.completed);
  const completedTodos = miscTodos.filter(t => t.completed);

  const addTodo = (text) => {
    if (!text.trim()) return;
    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    updatePatient(patient.id, {
      miscTodos: [...miscTodos, newTodo]
    });
    setNewTodoText('');
  };

  const toggleTodo = (todoId) => {
    const updatedTodos = miscTodos.map(todo =>
      todo.id === todoId
        ? { ...todo, completed: !todo.completed, completedAt: !todo.completed ? new Date().toISOString() : null }
        : todo
    );
    updatePatient(patient.id, { miscTodos: updatedTodos });
  };

  const deleteTodo = (todoId) => {
    updatePatient(patient.id, { miscTodos: miscTodos.filter(todo => todo.id !== todoId) });
  };

  // STAT Labs handlers
  const statLabs = patient.eosr?.statLabs || [];
  const pendingLabs = statLabs.filter(l => !l.completed);
  const completedLabs = statLabs.filter(l => l.completed);

  const addLab = (text) => {
    if (!text.trim()) return;
    const newLab = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    updatePatient(patient.id, {
      eosr: { ...patient.eosr, statLabs: [...statLabs, newLab] }
    });
    setNewLabText('');
  };

  const toggleLab = (labId) => {
    const updatedLabs = statLabs.map(lab =>
      lab.id === labId ? { ...lab, completed: !lab.completed } : lab
    );
    updatePatient(patient.id, {
      eosr: { ...patient.eosr, statLabs: updatedLabs }
    });
  };

  // Weight calculations
  const preOverDW = useMemo(() => {
    if (patient.preWeight && patient.dryWeight) {
      return (patient.preWeight - patient.dryWeight).toFixed(2);
    }
    return null;
  }, [patient.preWeight, patient.dryWeight]);

  const targetWeight = useMemo(() => {
    if (patient.preWeight && patient.goalUF) {
      return (patient.preWeight - patient.goalUF).toFixed(2);
    }
    return null;
  }, [patient.preWeight, patient.goalUF]);

  const postVsDW = useMemo(() => {
    if (patient.postWeight && patient.dryWeight) {
      return (patient.postWeight - patient.dryWeight).toFixed(2);
    }
    return null;
  }, [patient.postWeight, patient.dryWeight]);

  const actualUF = useMemo(() => {
    if (patient.preWeight && patient.postWeight) {
      return (patient.preWeight - patient.postWeight).toFixed(2);
    }
    return null;
  }, [patient.preWeight, patient.postWeight]);

  // Time calculations
  const actualDuration = useMemo(() => {
    if (patient.startTime && patient.endTime) {
      const [startH, startM] = patient.startTime.split(':').map(Number);
      const [endH, endM] = patient.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const duration = endMinutes - startMinutes;
      if (duration > 0) {
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}`;
      }
    }
    return null;
  }, [patient.startTime, patient.endTime]);

  // Get available sections for dropdown
  const availableSections = Object.keys(sectionConfig || {});

  return (
    <div className="full-patient-chart">
      {/* Quick View Header */}
      <div className="chart-section quick-view-section">
        <div className="quick-view-header">
          <div className="quick-view-title">
            <span className="section-icon">👁️</span>
            <span>Quick View - {patient.name || 'Patient'}</span>
          </div>
          <div className="quick-view-actions">
            <button className="quick-view-btn" onClick={() => setCollapsedSections({})}>📂 Expand</button>
            <button className="quick-view-btn" onClick={() => {
              const allCollapsed = {};
              ['techcheck', 'qa', 'assignment', 'orders', 'weight', 'time'].forEach(s => allCollapsed[s] = true);
              setCollapsedSections(allCollapsed);
            }}>📁 Collapse</button>
            <button
              className={`chart-closed-btn ${patient.qa?.chartClosed ? 'active' : ''}`}
              onClick={() => handleQAChange('chartClosed', !patient.qa?.chartClosed)}
            >
              {patient.qa?.chartClosed ? '✅ Chart Closed' : '⬜ Chart Closed'}
            </button>
          </div>
        </div>
        <div className="quick-view-grid">
          <div className="quick-view-item">
            <label>Rx Time</label>
            <input
              type="time"
              value={patient.rxTime || patient.startTime || ''}
              onChange={(e) => handleFieldChange('rxTime', e.target.value)}
              placeholder="HH:MM"
            />
          </div>
          <div className="quick-view-item">
            <label>Dialyzer</label>
            <input
              type="text"
              value={patient.dialyzer || ''}
              onChange={(e) => handleFieldChange('dialyzer', e.target.value)}
              placeholder="Revaclear 400"
            />
          </div>
          <div className="quick-view-item">
            <label>Dry Weight</label>
            <span className="quick-view-value">{patient.dryWeight ? `${patient.dryWeight} kg` : '-- kg'}</span>
          </div>
          <div className="quick-view-item">
            <label>Pre Weight</label>
            <span className="quick-view-value">{patient.preWeight ? `${patient.preWeight} kg` : '-- kg'}</span>
          </div>
          <div className="quick-view-item">
            <label>Goal UF</label>
            <span className="quick-view-value">{patient.goalUF ? `${patient.goalUF} kg` : '-- kg'}</span>
          </div>
          <div className="quick-view-item">
            <label>Post Weight</label>
            <span className="quick-view-value">{patient.postWeight ? `${patient.postWeight} kg` : '-- kg'}</span>
          </div>
        </div>
      </div>

      {/* Tech Check Section */}
      <div className={`chart-section ${collapsedSections.techcheck ? 'collapsed' : ''}`}>
        <button className="section-header tech-check-header" onClick={() => toggleSection('techcheck')}>
          <span className="section-icon">⚙️</span>
          <span className="section-title">Tech Check (Missing Chart Items)</span>
          <span className="collapse-arrow">{collapsedSections.techcheck ? '▶' : '▼'}</span>
        </button>
        {!collapsedSections.techcheck && (
          <div className="section-content tech-check-content">
            <div className="tech-check-grid">
              <div className="tech-check-column">
                <h5>📋 Main Flowsheet</h5>
                {TECH_CHECK_ITEMS.mainFlowsheet.map(item => (
                  <label key={item.id} className="tech-check-item">
                    <input
                      type="checkbox"
                      checked={techCheck[item.id] || false}
                      onChange={(e) => handleTechCheckChange(item.id, e.target.checked)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <div className="tech-check-column">
                <h5>💉 Dialysis Treatment</h5>
                {TECH_CHECK_ITEMS.dialysisTreatment.map(item => (
                  <label key={item.id} className="tech-check-item">
                    <input
                      type="checkbox"
                      checked={techCheck[item.id] || false}
                      onChange={(e) => handleTechCheckChange(item.id, e.target.checked)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <div className="tech-check-column">
                <h5>💊 Dialysis Meds</h5>
                {TECH_CHECK_ITEMS.dialysisMeds.map(item => (
                  <label key={item.id} className="tech-check-item">
                    <input
                      type="checkbox"
                      checked={techCheck[item.id] || false}
                      onChange={(e) => handleTechCheckChange(item.id, e.target.checked)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <div className="tech-check-column">
                <h5>✅ Post Dialysis</h5>
                {TECH_CHECK_ITEMS.postDialysis.map(item => (
                  <label key={item.id} className="tech-check-item">
                    <input
                      type="checkbox"
                      checked={techCheck[item.id] || false}
                      onChange={(e) => handleTechCheckChange(item.id, e.target.checked)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QA Checklist Section */}
      <div className={`chart-section ${collapsedSections.qa ? 'collapsed' : ''}`}>
        <button className="section-header qa-header" onClick={() => toggleSection('qa')}>
          <span className="section-icon">✅</span>
          <span className="section-title">QA Checklist</span>
          <span className="collapse-arrow">{collapsedSections.qa ? '▶' : '▼'}</span>
        </button>
        {!collapsedSections.qa && (
          <div className="section-content qa-content">
            {/* 5-Column QA Grid */}
            <div className="qa-boxes-grid">
              {/* Pre Check Column */}
              <div className="qa-column">
                <label className="qa-main-checkbox">
                  <input
                    type="checkbox"
                    checked={patient.qa?.preCheck || false}
                    onChange={(e) => handleQAChange('preCheck', e.target.checked)}
                  />
                  Pre Check
                </label>
              </div>

              {/* Meds Column */}
              <div className="qa-column">
                <label className="qa-main-checkbox">
                  <input
                    type="checkbox"
                    checked={patient.qa?.meds || false}
                    onChange={(e) => handleQAChange('meds', e.target.checked)}
                  />
                  Meds
                </label>
              </div>

              {/* Misc Column */}
              <div className="qa-column">
                <label className="qa-main-checkbox">
                  <input
                    type="checkbox"
                    checked={patient.qa?.thirtyMin || false}
                    onChange={(e) => handleQAChange('thirtyMin', e.target.checked)}
                  />
                  Misc
                </label>
                <div className="qa-sub-items">
                  <label className="qa-sub-checkbox">
                    <input
                      type="checkbox"
                      checked={patient.qa?.abxIdpn || false}
                      onChange={(e) => handleQAChange('abxIdpn', e.target.checked)}
                    />
                    Abx/IDPN
                  </label>
                  <label className="qa-sub-checkbox">
                    <input
                      type="checkbox"
                      checked={patient.qa?.statLabs || false}
                      onChange={(e) => handleQAChange('statLabs', e.target.checked)}
                    />
                    STAT Labs
                  </label>
                  <label className="qa-sub-checkbox">
                    <input
                      type="checkbox"
                      checked={patient.qa?.labsPrep || false}
                      onChange={(e) => handleQAChange('labsPrep', e.target.checked)}
                    />
                    Labs Prep
                  </label>
                </div>
              </div>

              {/* Hosp Column */}
              <div className="qa-column">
                <label className="qa-main-checkbox hosp-checkbox">
                  <input
                    type="checkbox"
                    checked={patient.hospitalized?.isHosp || false}
                    onChange={(e) => updatePatient(patient.id, {
                      hospitalized: { ...patient.hospitalized, isHosp: e.target.checked }
                    })}
                  />
                  🏥 Hosp
                </label>
                {patient.hospitalized?.isHosp && (
                  <input
                    type="number"
                    className="hosp-days-input"
                    placeholder="Days"
                    value={patient.hospitalized?.days || ''}
                    onChange={(e) => updatePatient(patient.id, {
                      hospitalized: { ...patient.hospitalized, days: parseInt(e.target.value) || 0 }
                    })}
                  />
                )}
              </div>

              {/* Missed Column */}
              <div className="qa-column">
                <label className="qa-main-checkbox missed-checkbox">
                  <input
                    type="checkbox"
                    checked={patient.missedTx?.isMissed || false}
                    onChange={(e) => updatePatient(patient.id, {
                      missedTx: { ...patient.missedTx, isMissed: e.target.checked }
                    })}
                  />
                  ⚠️ Missed
                </label>
                {patient.missedTx?.isMissed && (
                  <input
                    type="number"
                    className="missed-count-input"
                    placeholder="# Missed"
                    value={patient.missedTx?.count || ''}
                    onChange={(e) => updatePatient(patient.id, {
                      missedTx: { ...patient.missedTx, count: parseInt(e.target.value) || 0 }
                    })}
                  />
                )}
              </div>
            </div>

            {/* Misc To-Do and STAT Labs Row */}
            <div className="qa-bottom-row">
              {/* Misc To-Do List */}
              <div className="misc-todo-section">
                <div className="misc-todo-header">
                  <span>▼ 📝 Misc To-Do List</span>
                </div>
                <div className="misc-todo-content">
                  <div className="todo-input-row">
                    <input
                      type="text"
                      placeholder="Enter a to-do item..."
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTodo(newTodoText)}
                    />
                    <button className="add-btn" onClick={() => addTodo(newTodoText)}>+ Add To Do</button>
                  </div>
                  <div className="todo-snippet-buttons">
                    {TODO_SNIPPETS.map(snippet => (
                      <button
                        key={snippet.id}
                        className="snippet-btn"
                        onClick={() => addTodo(snippet.text)}
                      >
                        {snippet.label}
                      </button>
                    ))}
                  </div>
                  <div className="todo-lists">
                    <div className="todo-section">
                      <h6>☐ TO DO</h6>
                      {incompleteTodos.length === 0 ? (
                        <p className="empty-text">No pending to-dos</p>
                      ) : (
                        incompleteTodos.map(todo => (
                          <div key={todo.id} className="todo-item">
                            <label>
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => toggleTodo(todo.id)}
                              />
                              {todo.text}
                            </label>
                            <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>×</button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="todo-section completed-section">
                      <h6>✅ COMPLETE</h6>
                      {completedTodos.length === 0 ? (
                        <p className="empty-text">No completed to-dos</p>
                      ) : (
                        completedTodos.map(todo => (
                          <div key={todo.id} className="todo-item completed">
                            <label>
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => toggleTodo(todo.id)}
                              />
                              <span className="strikethrough">{todo.text}</span>
                            </label>
                            <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>×</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* STAT Labs Section */}
              <div className="stat-labs-section">
                <div className="stat-labs-header">
                  <span>▼ 🧪 STAT Labs</span>
                </div>
                <div className="stat-labs-content">
                  <div className="lab-input-row">
                    <input
                      type="text"
                      placeholder="Enter a lab..."
                      value={newLabText}
                      onChange={(e) => setNewLabText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addLab(newLabText)}
                    />
                    <button className="add-btn lab-add" onClick={() => addLab(newLabText)}>+ Add Lab</button>
                  </div>
                  <div className="lab-snippet-buttons">
                    {LAB_SNIPPETS.map(snippet => (
                      <button
                        key={snippet.id}
                        className="snippet-btn lab-snippet"
                        onClick={() => addLab(snippet.text)}
                      >
                        {snippet.label}
                      </button>
                    ))}
                  </div>
                  <div className="lab-lists">
                    <div className="lab-section">
                      <h6>🧪 PENDING LABS</h6>
                      {pendingLabs.length === 0 ? (
                        <p className="empty-text">No pending labs</p>
                      ) : (
                        pendingLabs.map(lab => (
                          <div key={lab.id} className="lab-item">
                            <label>
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => toggleLab(lab.id)}
                              />
                              {lab.text}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="lab-section completed-section">
                      <h6>✅ COMPLETED LABS</h6>
                      {completedLabs.length === 0 ? (
                        <p className="empty-text">No completed labs</p>
                      ) : (
                        completedLabs.map(lab => (
                          <div key={lab.id} className="lab-item completed">
                            <label>
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => toggleLab(lab.id)}
                              />
                              <span className="strikethrough">{lab.text}</span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Section */}
      <div className={`chart-section ${collapsedSections.assignment ? 'collapsed' : ''}`}>
        <button className="section-header assignment-header" onClick={() => toggleSection('assignment')}>
          <span className="section-icon">👥</span>
          <span className="section-title">Assignment (Tech/Pod/Chair)</span>
          <span className="collapse-arrow">{collapsedSections.assignment ? '▶' : '▼'}</span>
        </button>
        {!collapsedSections.assignment && (
          <div className="section-content assignment-content">
            <div className="assignment-grid">
              <div className="assignment-item">
                <label>Section</label>
                <select
                  value={patient.section || ''}
                  onChange={(e) => handleFieldChange('section', e.target.value)}
                >
                  <option value="">Select Section</option>
                  {availableSections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
              <div className="assignment-item">
                <label>Technician 🔧</label>
                <select
                  value={patient.tech || ''}
                  onChange={(e) => handleFieldChange('tech', e.target.value)}
                >
                  <option value="">Select Tech...</option>
                  {technicians.map((tech, i) => (
                    <option key={i} value={tech.name}>{tech.name}</option>
                  ))}
                </select>
              </div>
              <div className="assignment-item">
                <label>Pod (auto-assigned)</label>
                <input
                  type="text"
                  value={patient.pod || ''}
                  onChange={(e) => handleFieldChange('pod', e.target.value)}
                  placeholder="Auto-fills from tech"
                  className="pod-input"
                />
              </div>
              <div className="assignment-item">
                <label>Chair # 🔧</label>
                <select
                  value={patient.chair || ''}
                  onChange={(e) => handleFieldChange('chair', e.target.value)}
                >
                  <option value="">Select Chair...</option>
                  {Array.from({ length: 36 }, (_, i) => i + 1).map(chair => (
                    <option key={chair} value={chair}>{chair}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Treatment Orders Section */}
      <div className={`chart-section ${collapsedSections.orders ? 'collapsed' : ''}`}>
        <button className="section-header orders-header" onClick={() => toggleSection('orders')}>
          <span className="section-icon">📋</span>
          <span className="section-title">Treatment Orders</span>
          <span className="collapse-arrow">{collapsedSections.orders ? '▶' : '▼'}</span>
        </button>
        {!collapsedSections.orders && (
          <div className="section-content orders-content">
            <div className="orders-grid">
              <div className="orders-row">
                <div className="orders-item">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    value={patient.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>Shift 🔧</label>
                  <select
                    value={patient.shift || '1st'}
                    onChange={(e) => handleFieldChange('shift', e.target.value)}
                  >
                    <option value="1st">1st Shift</option>
                    <option value="2nd">2nd Shift</option>
                    <option value="3rd">3rd Shift</option>
                  </select>
                </div>
                <div className="orders-item">
                  <label>Rx Time (h:mm) 🔧</label>
                  <input
                    type="text"
                    value={patient.rxTimeOrdered || '03:00'}
                    onChange={(e) => handleFieldChange('rxTimeOrdered', e.target.value)}
                    placeholder="03:00"
                  />
                </div>
                <div className="orders-item">
                  <label>Dialyzer</label>
                  <input
                    type="text"
                    value={patient.dialyzer || ''}
                    onChange={(e) => handleFieldChange('dialyzer', e.target.value)}
                    placeholder="Revaclear 400"
                  />
                </div>
                <div className="orders-item">
                  <label>Bi</label>
                  <input
                    type="text"
                    value={patient.bi || ''}
                    onChange={(e) => handleFieldChange('bi', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>Profile</label>
                  <input
                    type="text"
                    value={patient.profile || ''}
                    onChange={(e) => handleFieldChange('profile', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>NA</label>
                  <input
                    type="text"
                    value={patient.na || ''}
                    onChange={(e) => handleFieldChange('na', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>K 🔧</label>
                  <input
                    type="text"
                    value={patient.k || ''}
                    onChange={(e) => handleFieldChange('k', e.target.value)}
                  />
                </div>
              </div>
              <div className="orders-row">
                <div className="orders-item">
                  <label>CA</label>
                  <input
                    type="text"
                    value={patient.ca || ''}
                    onChange={(e) => handleFieldChange('ca', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>DFR</label>
                  <input
                    type="text"
                    value={patient.dfr || ''}
                    onChange={(e) => handleFieldChange('dfr', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>BFR</label>
                  <input
                    type="text"
                    value={patient.bfr || ''}
                    onChange={(e) => handleFieldChange('bfr', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>Arterial Needle Gauge</label>
                  <input
                    type="text"
                    value={patient.arterialNeedle || ''}
                    onChange={(e) => handleFieldChange('arterialNeedle', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>Venous Needle Gauge</label>
                  <input
                    type="text"
                    value={patient.venousNeedle || ''}
                    onChange={(e) => handleFieldChange('venousNeedle', e.target.value)}
                  />
                </div>
                <div className="orders-item">
                  <label>Temp</label>
                  <input
                    type="text"
                    value={patient.temp || ''}
                    onChange={(e) => handleFieldChange('temp', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weight & UF Management Section */}
      <div className={`chart-section ${collapsedSections.weight ? 'collapsed' : ''}`}>
        <button className="section-header weight-header" onClick={() => toggleSection('weight')}>
          <span className="section-icon">⚖️</span>
          <span className="section-title">Weight & UF Management</span>
          <span className="collapse-arrow">{collapsedSections.weight ? '▶' : '▼'}</span>
        </button>
        {!collapsedSections.weight && (
          <div className="section-content weight-content">
            <div className="weight-grid">
              <div className="weight-item">
                <label>Dry Weight (kg) 🔧</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.dryWeight || ''}
                  onChange={(e) => handleFieldChange('dryWeight', parseFloat(e.target.value) || null)}
                />
              </div>
              <div className="weight-item">
                <label>Pre Weight (kg) 🔧</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.preWeight || ''}
                  onChange={(e) => handleFieldChange('preWeight', parseFloat(e.target.value) || null)}
                />
              </div>
              <div className="weight-item">
                <label>Goal UF (kg) 🔧</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.goalUF || ''}
                  onChange={(e) => handleFieldChange('goalUF', parseFloat(e.target.value) || null)}
                  placeholder="Enter goal"
                />
              </div>
              <div className="weight-item">
                <label>Post Weight (kg) 🔧</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.postWeight || ''}
                  onChange={(e) => handleFieldChange('postWeight', parseFloat(e.target.value) || null)}
                />
              </div>
              <div className="weight-item calculated">
                <label>📊 Actual UF (kg)</label>
                <span className="calculated-value">{actualUF || 'Auto'}</span>
              </div>
            </div>
            <div className="weight-grid">
              <div className="weight-item calculated">
                <label>📊 Pre Over DW (kg)</label>
                <span className="calculated-value">{preOverDW || 'Auto'}</span>
              </div>
              <div className="weight-item calculated highlight">
                <label>📊 Target Weight (kg)</label>
                <span className="calculated-value target">{targetWeight || 'Auto'}</span>
              </div>
              <div className="weight-item calculated">
                <label>📊 Post vs DW (kg)</label>
                <span className="calculated-value">{postVsDW || 'Auto'}</span>
              </div>
            </div>

            {/* Pre/Post Dialysis Documentation */}
            <div className="dialysis-docs-row">
              <div className="dialysis-doc">
                <h5>☐ Pre Dialysis</h5>
                <textarea
                  placeholder="Enter Goal UF to generate pre-dialysis documentation"
                  value={patient.preDialysisDoc || ''}
                  onChange={(e) => handleFieldChange('preDialysisDoc', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="dialysis-doc">
                <h5>☐ Post Dialysis</h5>
                <textarea
                  placeholder="Enter all weight values to generate documentation snippet"
                  value={patient.postDialysisDoc || ''}
                  onChange={(e) => handleFieldChange('postDialysisDoc', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Treatment Time Tracking Section */}
      <div className={`chart-section ${collapsedSections.time ? 'collapsed' : ''}`}>
        <button className="section-header time-header" onClick={() => toggleSection('time')}>
          <span className="section-icon">⏱️</span>
          <span className="section-title">Treatment Time Tracking</span>
          <span className="collapse-arrow">{collapsedSections.time ? '▶' : '▼'}</span>
        </button>
        {!collapsedSections.time && (
          <div className="section-content time-content">
            <div className="time-grid">
              <div className="time-item">
                <label>Start Time (24hr) 🔧</label>
                <input
                  type="time"
                  value={patient.startTime || ''}
                  onChange={(e) => handleFieldChange('startTime', e.target.value)}
                  placeholder="HH:MM (e.g., 0800)"
                />
              </div>
              <div className="time-item">
                <label>End Time (24hr) 🔧</label>
                <input
                  type="time"
                  value={patient.endTime || ''}
                  onChange={(e) => handleFieldChange('endTime', e.target.value)}
                  placeholder="HH:MM (e.g., 1130)"
                />
              </div>
              <div className="time-item calculated">
                <label>📊 Actual Duration</label>
                <span className="calculated-value">{actualDuration || 'Auto'}</span>
              </div>
              <div className="time-item calculated">
                <label>⚠️ Time +/- Rx</label>
                <span className="calculated-value">Auto</span>
              </div>
            </div>

            {/* Treatment Time Documentation */}
            <div className="time-doc">
              <h5>☐ Treatment Time Documentation</h5>
              <textarea
                placeholder="Enter start time, end time, and Rx time to generate documentation"
                value={patient.timeDoc || ''}
                onChange={(e) => handleFieldChange('timeDoc', e.target.value)}
                rows={3}
              />
              <button className="copy-snippet-btn">📋 Copy Time Documentation</button>
            </div>
          </div>
        )}
      </div>

      {/* HD Flowsheet Quick Notes Button */}
      <button className="quick-notes-button" onClick={() => onOpenQuickNotes && onOpenQuickNotes(patient.id)}>
        📝 HD Flowsheet Quick Notes
      </button>

      {/* Delete Patient */}
      <div className="chart-actions">
        <button
          className="delete-patient-btn"
          onClick={() => {
            if (confirm(`Delete patient "${patient.name || 'this patient'}"? This cannot be undone.`)) {
              deletePatient(patient.id);
            }
          }}
        >
          🗑️ Delete Patient
        </button>
      </div>
    </div>
  );
};

export default FullPatientChart;
