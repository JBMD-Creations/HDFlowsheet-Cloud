import { useState } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import { RealtimeAvatarStack } from '../realtime-avatar-stack';

// Quick-add todo snippets
const TODO_SNIPPETS = [
  { id: 'access', label: 'Access Assessment', text: 'Access assessment chart' },
  { id: 'foot', label: 'Foot Check', text: 'Foot check' },
  { id: 'progress', label: 'Progress Note', text: 'Monthly/Daily progress note' },
  { id: 'notify', label: 'Notify MD/NP', text: 'Notify MD/NP' },
  { id: 'phn', label: 'PHN Call', text: 'PHN Call' },
];

const PatientCard = ({ patient }) => {
  const { updatePatient, deletePatient } = usePatients();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const handleQAChange = (field, value) => {
    updatePatient(patient.id, {
      qa: { ...patient.qa, [field]: value }
    });
  };

  const handleFieldChange = (field, value) => {
    updatePatient(patient.id, { [field]: value });
  };

  const calculateUF = () => {
    if (patient.preWeight && patient.postWeight) {
      return (patient.preWeight - patient.postWeight).toFixed(2);
    }
    return patient.goalUF || '—';
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
    const updatedTodos = miscTodos.filter(todo => todo.id !== todoId);
    updatePatient(patient.id, { miscTodos: updatedTodos });
  };

  const handleTodoKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodo(newTodoText);
    }
  };

  return (
    <div className={`patient-card ${patient.qa?.chartClosed ? 'chart-closed' : ''}`}>
      {/* Header */}
      <div className="patient-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="patient-info">
          <h3>
            {patient.name || 'Unnamed Patient'}
            {patient.chair && <span className="chair-badge">Chair {patient.chair}</span>}
          </h3>
          <p className="patient-meta">
            {patient.tech || 'No Tech'} | {patient.section || 'No Section'}
          </p>
        </div>
        <div className="header-badges">
          <RealtimeAvatarStack roomName={`patient:${patient.id}:viewers`} />
          {incompleteTodos.length > 0 && (
            <span className="todo-badge">{incompleteTodos.length}</span>
          )}
          <button className="expand-btn">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* QA Status Pills */}
      <div className="qa-pills">
        <span className={`qa-pill ${patient.qa?.preCheck ? 'complete' : 'pending'}`}>
          Pre
        </span>
        <span className={`qa-pill ${patient.qa?.thirtyMin ? 'complete' : 'pending'}`}>
          30min
        </span>
        <span className={`qa-pill ${patient.qa?.meds ? 'complete' : 'pending'}`}>
          Meds
        </span>
        <span className={`qa-pill ${patient.qa?.ettSigned ? 'complete' : 'pending'}`}>
          Post
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="patient-card-body">
          {/* QA Checklist */}
          <div className="section">
            <h4>QA Checklist</h4>
            <div className="checkbox-grid">
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.preCheck || false}
                  onChange={(e) => handleQAChange('preCheck', e.target.checked)}
                />
                Pre Check
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.thirtyMin || false}
                  onChange={(e) => handleQAChange('thirtyMin', e.target.checked)}
                />
                30 Min Check
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.meds || false}
                  onChange={(e) => handleQAChange('meds', e.target.checked)}
                />
                Meds
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.abxIdpn || false}
                  onChange={(e) => handleQAChange('abxIdpn', e.target.checked)}
                />
                Abx/IDPN
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.statLabs || false}
                  onChange={(e) => handleQAChange('statLabs', e.target.checked)}
                />
                STAT Labs
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.labsPrep || false}
                  onChange={(e) => handleQAChange('labsPrep', e.target.checked)}
                />
                Labs Prep
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.whiteboard || false}
                  onChange={(e) => handleQAChange('whiteboard', e.target.checked)}
                />
                Whiteboard
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.ettSigned || false}
                  onChange={(e) => handleQAChange('ettSigned', e.target.checked)}
                />
                ETT Signed
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={patient.qa?.chartClosed || false}
                  onChange={(e) => handleQAChange('chartClosed', e.target.checked)}
                />
                <strong>Chart Closed</strong>
              </label>
            </div>
          </div>

          {/* Misc To-Do Section */}
          <div className="section misc-todo-section">
            <h4>
              Misc To-Do
              {incompleteTodos.length > 0 && (
                <span className="section-badge">{incompleteTodos.length}</span>
              )}
            </h4>

            {/* Quick-add snippet buttons */}
            <div className="todo-snippet-buttons">
              {TODO_SNIPPETS.map(snippet => (
                <button
                  key={snippet.id}
                  className="todo-snippet-btn"
                  onClick={() => addTodo(snippet.text)}
                  title={snippet.text}
                >
                  {snippet.label}
                </button>
              ))}
            </div>

            {/* Add custom todo input */}
            <div className="todo-input-row">
              <input
                type="text"
                placeholder="Add custom to-do..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={handleTodoKeyPress}
                className="todo-input"
              />
              <button
                className="todo-add-btn"
                onClick={() => addTodo(newTodoText)}
                disabled={!newTodoText.trim()}
              >
                Add
              </button>
            </div>

            {/* Incomplete todos */}
            {incompleteTodos.length > 0 && (
              <div className="todo-list">
                {incompleteTodos.map(todo => (
                  <div key={todo.id} className="todo-item">
                    <label className="todo-checkbox">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleTodo(todo.id)}
                      />
                      <span className="todo-text">{todo.text}</span>
                    </label>
                    <button
                      className="todo-delete-btn"
                      onClick={() => deleteTodo(todo.id)}
                      aria-label="Delete todo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed todos (collapsible) */}
            {completedTodos.length > 0 && (
              <div className="completed-todos">
                <button
                  className="completed-toggle"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  {showCompleted ? '▼' : '▶'} Completed ({completedTodos.length})
                </button>
                {showCompleted && (
                  <div className="todo-list completed">
                    {completedTodos.map(todo => (
                      <div key={todo.id} className="todo-item completed">
                        <label className="todo-checkbox">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => toggleTodo(todo.id)}
                          />
                          <span className="todo-text">{todo.text}</span>
                        </label>
                        <button
                          className="todo-delete-btn"
                          onClick={() => deleteTodo(todo.id)}
                          aria-label="Delete todo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {incompleteTodos.length === 0 && completedTodos.length === 0 && (
              <p className="todo-empty">No to-do items. Use buttons above to add.</p>
            )}
          </div>

          {/* Weight & UF */}
          <div className="section">
            <h4>Weight & UF Management</h4>
            <div className="input-grid">
              <div className="input-group">
                <label>Dry Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.dryWeight || ''}
                  onChange={(e) => handleFieldChange('dryWeight', parseFloat(e.target.value))}
                  placeholder="0.0"
                />
              </div>
              <div className="input-group">
                <label>Pre Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.preWeight || ''}
                  onChange={(e) => handleFieldChange('preWeight', parseFloat(e.target.value))}
                  placeholder="0.0"
                />
              </div>
              <div className="input-group">
                <label>Goal UF (L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.goalUF || ''}
                  onChange={(e) => handleFieldChange('goalUF', parseFloat(e.target.value))}
                  placeholder="0.0"
                />
              </div>
              <div className="input-group">
                <label>Post Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.postWeight || ''}
                  onChange={(e) => handleFieldChange('postWeight', parseFloat(e.target.value))}
                  placeholder="0.0"
                />
              </div>
              <div className="input-group">
                <label>Actual UF (L)</label>
                <div className="calculated-field">{calculateUF()}</div>
              </div>
            </div>
          </div>

          {/* Treatment Times */}
          <div className="section">
            <h4>Treatment Times</h4>
            <div className="input-grid">
              <div className="input-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={patient.startTime || ''}
                  onChange={(e) => handleFieldChange('startTime', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={patient.endTime || ''}
                  onChange={(e) => handleFieldChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="section">
            <h4>Notes</h4>
            <textarea
              value={patient.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Add notes here..."
              rows="3"
            />
          </div>

          {/* Delete Button */}
          <button
            className="delete-patient-btn"
            onClick={() => {
              if (confirm('Delete this patient?')) {
                deletePatient(patient.id);
              }
            }}
          >
            Delete Patient
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientCard;
