import { useState } from 'react';
import { useSnippets } from '../../contexts/SnippetContext';
import './SnippetsManager.css';

const SnippetsManager = () => {
  const { configurations, setConfigurations, activeConfigId, getActiveConfig } = useSnippets();
  const [copiedId, setCopiedId] = useState(null);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [newSnippetText, setNewSnippetText] = useState('');

  const activeConfig = getActiveConfig();

  const handleCopySnippet = (text, snippetId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(snippetId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleAddSnippet = (sectionId) => {
    if (newSnippetText.trim()) {
      const newSnippet = {
        id: Date.now(),
        text: newSnippetText.trim(),
        tags: []
      };

      const updatedConfigs = configurations.map(config => {
        if (config.id === activeConfigId) {
          return {
            ...config,
            sections: config.sections.map(section => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  snippets: [...(section.snippets || []), newSnippet]
                };
              }
              return section;
            })
          };
        }
        return config;
      });

      setConfigurations(updatedConfigs);
      setNewSnippetText('');
      setEditingSectionId(null);
    }
  };

  const handleDeleteSnippet = (sectionId, snippetId) => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      const updatedConfigs = configurations.map(config => {
        if (config.id === activeConfigId) {
          return {
            ...config,
            sections: config.sections.map(section => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  snippets: section.snippets.filter(s => s.id !== snippetId)
                };
              }
              return section;
            })
          };
        }
        return config;
      });

      setConfigurations(updatedConfigs);
    }
  };

  if (!activeConfig) {
    return (
      <div className="snippets-manager">
        <div className="snippets-empty">
          <div className="empty-icon">📝</div>
          <h3>No Configuration Found</h3>
          <p>Please set up a snippet configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="snippets-manager">
      <div className="snippets-header">
        <div>
          <h2>Quick Snippets</h2>
          <p className="snippets-subtitle">
            Click any snippet to copy it to your clipboard
          </p>
        </div>
        <div className="config-badge">
          {activeConfig.name}
        </div>
      </div>

      {activeConfig.sections?.map(section => {
        const snippets = section.snippets || [];

        return (
          <div key={section.id} className="snippet-section">
            <div className="section-header">
              <h3>
                <span className="section-icon">{section.icon}</span>
                {section.name}
              </h3>
              <span className="snippet-count">{snippets.length} snippets</span>
            </div>

            <div className="snippets-grid">
              {snippets.map(snippet => (
                <div
                  key={snippet.id}
                  className={`snippet-card ${copiedId === snippet.id ? 'copied' : ''}`}
                  onClick={() => handleCopySnippet(snippet.text, snippet.id)}
                >
                  <div className="snippet-text">{snippet.text}</div>
                  <div className="snippet-footer">
                    {snippet.tags?.length > 0 && (
                      <div className="snippet-tags">
                        {snippet.tags.map((tag, index) => (
                          <span key={index} className="snippet-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      className="delete-snippet-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSnippet(section.id, snippet.id);
                      }}
                      aria-label="Delete snippet"
                    >
                      ×
                    </button>
                  </div>
                  {copiedId === snippet.id && (
                    <div className="copied-indicator">
                      ✓ Copied!
                    </div>
                  )}
                </div>
              ))}

              {editingSectionId === section.id ? (
                <div className="add-snippet-card">
                  <textarea
                    placeholder="Enter snippet text..."
                    value={newSnippetText}
                    onChange={(e) => setNewSnippetText(e.target.value)}
                    className="snippet-textarea"
                    autoFocus
                    rows={3}
                  />
                  <div className="snippet-actions">
                    <button
                      className="save-snippet-btn"
                      onClick={() => handleAddSnippet(section.id)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-snippet-btn"
                      onClick={() => {
                        setEditingSectionId(null);
                        setNewSnippetText('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="add-snippet-btn"
                  onClick={() => setEditingSectionId(section.id)}
                >
                  + Add Snippet
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="snippets-info">
        <div className="info-icon">💡</div>
        <div>
          <strong>Pro Tip:</strong> Click any snippet to instantly copy it to your clipboard.
          Perfect for quick charting notes!
        </div>
      </div>
    </div>
  );
};

export default SnippetsManager;
