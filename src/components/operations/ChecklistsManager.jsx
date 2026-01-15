import { useState } from 'react';
import { useOperations } from '../../contexts/OperationsContext';
import './ChecklistsManager.css';

const ChecklistsManager = () => {
  const { checklists, addChecklist, updateChecklist, deleteChecklist } = useOperations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistPosition, setNewChecklistPosition] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItemText, setNewItemText] = useState('');

  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (newChecklistName.trim() && newChecklistPosition.trim()) {
      addChecklist(newChecklistName.trim(), newChecklistPosition.trim());
      setNewChecklistName('');
      setNewChecklistPosition('');
      setShowAddForm(false);
    }
  };

  const handleAddItem = (checklistId) => {
    if (newItemText.trim()) {
      const checklist = checklists.find(c => c.id === checklistId);
      const newItem = {
        id: Date.now(),
        text: newItemText.trim(),
        completed: false
      };
      const updatedItems = [...(checklist.items || []), newItem];
      updateChecklist(checklistId, { items: updatedItems });
      setNewItemText('');
      setEditingItemId(null);
    }
  };

  const handleToggleItem = (checklistId, itemId) => {
    const checklist = checklists.find(c => c.id === checklistId);
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateChecklist(checklistId, { items: updatedItems });
  };

  const handleDeleteItem = (checklistId, itemId) => {
    const checklist = checklists.find(c => c.id === checklistId);
    const updatedItems = checklist.items.filter(item => item.id !== itemId);
    updateChecklist(checklistId, { items: updatedItems });
  };

  const handleDeleteChecklist = (checklistId) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      deleteChecklist(checklistId);
    }
  };

  return (
    <div className="checklists-manager">
      <div className="checklists-header">
        <div>
          <h2>Checklists</h2>
          <p className="checklists-subtitle">
            Manage daily checklists for different positions
          </p>
        </div>
        <button
          className="add-checklist-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ New Checklist'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddChecklist} className="add-checklist-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Checklist Name (e.g., RN Opening)"
              value={newChecklistName}
              onChange={(e) => setNewChecklistName(e.target.value)}
              className="checklist-name-input"
              autoFocus
            />
            <input
              type="text"
              placeholder="Position (e.g., RN, Tech, Admin)"
              value={newChecklistPosition}
              onChange={(e) => setNewChecklistPosition(e.target.value)}
              className="checklist-position-input"
            />
            <button type="submit" className="create-checklist-btn">
              Create
            </button>
          </div>
        </form>
      )}

      {checklists.length === 0 ? (
        <div className="checklists-empty">
          <div className="empty-icon">📋</div>
          <h3>No Checklists Yet</h3>
          <p>Create your first checklist to get started</p>
        </div>
      ) : (
        <div className="checklists-grid">
          {checklists.map(checklist => {
            const completedCount = checklist.items?.filter(item => item.completed).length || 0;
            const totalCount = checklist.items?.length || 0;
            const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div key={checklist.id} className="checklist-card">
                <div className="checklist-card-header">
                  <div>
                    <h3>{checklist.name}</h3>
                    <span className="checklist-position">{checklist.position}</span>
                  </div>
                  <button
                    className="delete-checklist-btn"
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    aria-label="Delete checklist"
                  >
                    🗑️
                  </button>
                </div>

                {totalCount > 0 && (
                  <div className="checklist-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {completedCount} / {totalCount} ({completionPercent}%)
                    </span>
                  </div>
                )}

                <div className="checklist-items">
                  {checklist.items?.map(item => (
                    <div key={item.id} className="checklist-item">
                      <label className="checklist-item-label">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleItem(checklist.id, item.id)}
                        />
                        <span className={item.completed ? 'completed' : ''}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        className="delete-item-btn"
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        aria-label="Delete item"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-item-section">
                  {editingItemId === checklist.id ? (
                    <div className="add-item-form">
                      <input
                        type="text"
                        placeholder="New checklist item..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddItem(checklist.id);
                          }
                        }}
                        className="add-item-input"
                        autoFocus
                      />
                      <button
                        className="add-item-btn"
                        onClick={() => handleAddItem(checklist.id)}
                      >
                        Add
                      </button>
                      <button
                        className="cancel-item-btn"
                        onClick={() => {
                          setEditingItemId(null);
                          setNewItemText('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="show-add-item-btn"
                      onClick={() => setEditingItemId(checklist.id)}
                    >
                      + Add Item
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChecklistsManager;
