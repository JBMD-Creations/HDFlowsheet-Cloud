import { useState, useEffect, useRef } from 'react';
import { useSnippets } from '../../contexts/SnippetContext';
import './SnippetsSidePanel.css';

const SnippetsSidePanel = ({ isOpen, onClose }) => {
  // Use activeConfig directly from context (already memoized)
  const { activeConfig } = useSnippets();

  // Track if we've initialized expanded sections
  const initializedRef = useRef(false);

  // Start with empty Set - will be initialized properly when config loads
  const [expandedSections, setExpandedSections] = useState(() => {
    // If activeConfig is available immediately, expand first 3 sections
    if (activeConfig?.sections?.length > 0) {
      initializedRef.current = true;
      return new Set(activeConfig.sections.slice(0, 3).map(s => s.id));
    }
    return new Set();
  });
  const [selectedSnippets, setSelectedSnippets] = useState([]);
  const [generatedNote, setGeneratedNote] = useState('');
  const [bfr, setBfr] = useState(350);
  const [ufGoal, setUfGoal] = useState(2.0);
  const [preWeight, setPreWeight] = useState('');
  const [dryWeight, setDryWeight] = useState('');
  const [preOverDW, setPreOverDW] = useState('');
  const [calcUfGoal, setCalcUfGoal] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize expanded sections once when config is available
  useEffect(() => {
    if (!initializedRef.current && activeConfig?.sections?.length > 0) {
      const firstThreeIds = activeConfig.sections.slice(0, 3).map(s => s.id);
      setExpandedSections(new Set(firstThreeIds));
      initializedRef.current = true;
    }
  }, [activeConfig]);

  // Update calculations when weights change
  useEffect(() => {
    if (preWeight && dryWeight) {
      const pre = parseFloat(preWeight);
      const dry = parseFloat(dryWeight);
      const overDW = pre - dry;
      const uf = overDW + 0.4;
      const target = pre - uf;

      setPreOverDW(overDW.toFixed(1));
      setCalcUfGoal(uf.toFixed(1));
      setTargetWeight(target.toFixed(1));
    } else {
      setPreOverDW('');
      setCalcUfGoal('');
      setTargetWeight('');
    }
  }, [preWeight, dryWeight]);

  // Update generated note when selections change
  useEffect(() => {
    if (selectedSnippets.length === 0) {
      setGeneratedNote('Select options below to build your charting note...');
    } else {
      let note = selectedSnippets.join(' ');
      // Replace placeholders
      note = note.replace(/\[BFR\]/g, bfr);
      note = note.replace(/\[UF Goal\]/g, `${ufGoal} kg`);
      setGeneratedNote(note);
    }
  }, [selectedSnippets, bfr, ufGoal]);

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleSnippet = (text) => {
    setSelectedSnippets(prev => {
      if (prev.includes(text)) {
        return prev.filter(s => s !== text);
      } else {
        return [...prev, text];
      }
    });
  };

  const handleCopyNote = () => {
    if (generatedNote && generatedNote !== 'Select options below to build your charting note...') {
      navigator.clipboard.writeText(generatedNote).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleClearNote = () => {
    setSelectedSnippets([]);
    setGeneratedNote('');
  };

  if (!activeConfig) {
    return null;
  }

  return (
    <>
      {/* Drawer Panel - slides in from right, does NOT block main content */}
      <div className={`drawer-panel ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-header-content">
            <div className="drawer-title">📋 Charting Snippet Builder</div>
            <button
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close snippets panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {/* Generated Snippet Display (Sticky) */}
          <div className="generated-snippet-display">
            <div className="generated-snippet-title">Generated Note:</div>
            <div className="generated-snippet-text">
              {generatedNote || 'Select options below to build your charting note...'}
            </div>
            <div className="generated-snippet-actions">
              <button
                className={`drawer-btn-primary ${copied ? 'copied' : ''}`}
                onClick={handleCopyNote}
                disabled={!generatedNote || generatedNote === 'Select options below to build your charting note...'}
              >
                {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <button className="drawer-btn-secondary" onClick={handleClearNote}>
                🗑️ Clear
              </button>
            </div>

            {/* Pinned Quick Access Snippet */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button
                className={`snippet-builder-option pinned-snippet ${selectedSnippets.includes('Access visible and secure. Care ongoing.') ? 'selected' : ''}`}
                onClick={() => toggleSnippet('Access visible and secure. Care ongoing.')}
              >
                Access visible and secure. Care ongoing.
              </button>
            </div>
          </div>

          {/* Snippet Categories */}
          {activeConfig.sections?.map(section => {
            const isExpanded = expandedSections.has(section.id);
            const snippets = section.snippets || [];

            return (
              <div key={section.id} className="snippet-category">
                <button
                  className="snippet-category-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <span>{section.icon} {section.name}</span>
                  <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                </button>

                {isExpanded && (
                  <div className="snippet-category-body">
                    {/* Weight & UF Calculator for Weight & UF Management section */}
                    {(section.name === 'Weight & UF Management' || section.order === 0) && (
                      <div className="weight-calculator">
                        <div className="calc-input-group">
                          <label>Pre Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Pre Weight"
                            value={preWeight}
                            onChange={(e) => setPreWeight(e.target.value)}
                          />
                        </div>
                        <div className="calc-input-group">
                          <label>Dry Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Dry Weight"
                            value={dryWeight}
                            onChange={(e) => setDryWeight(e.target.value)}
                          />
                        </div>
                        <div className="calc-input-group">
                          <label>Pre Over DW</label>
                          <input
                            type="text"
                            readOnly
                            className="locked-calc-field"
                            value={preOverDW}
                            placeholder="Auto-calculated"
                          />
                        </div>
                        <div className="calc-input-group">
                          <label>UF Goal (kg)</label>
                          <input
                            type="text"
                            readOnly
                            className="locked-calc-field"
                            value={calcUfGoal}
                            placeholder="Pre Over DW + 0.4"
                          />
                        </div>
                        <div className="calc-input-group">
                          <label>Target Weight (kg)</label>
                          <input
                            type="text"
                            readOnly
                            className="locked-calc-field"
                            value={targetWeight}
                            placeholder="Pre Weight - UF Goal"
                          />
                        </div>
                        <div className="calc-info">
                          <strong>Auto-Calculations:</strong><br />
                          • Pre Over DW = Pre Weight - Dry Weight<br />
                          • UF Goal = Pre Over DW + 0.4 kg<br />
                          • Target Weight = Pre Weight - UF Goal
                        </div>
                      </div>
                    )}

                    {/* BFR and UF Sliders for Treatment Initiated section */}
                    {(section.name === 'Treatment Initiated' || section.order === 2) && (
                      <div className="sliders-section">
                        <div className="slider-group">
                          <label>
                            Blood Flow Rate: <span className="slider-value">{bfr}</span>
                          </label>
                          <input
                            type="range"
                            min="200"
                            max="500"
                            step="10"
                            value={bfr}
                            onChange={(e) => setBfr(parseInt(e.target.value))}
                            className="snippet-slider"
                          />
                        </div>
                        <div className="slider-group">
                          <label>
                            UF Goal: <span className="slider-value">{ufGoal} kg</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="6"
                            step="0.1"
                            value={ufGoal}
                            onChange={(e) => setUfGoal(parseFloat(e.target.value))}
                            className="snippet-slider"
                          />
                        </div>
                      </div>
                    )}

                    {/* Snippet Options */}
                    <div className="snippet-options">
                      {snippets.map(snippet => (
                        <button
                          key={snippet.id}
                          className={`snippet-builder-option ${selectedSnippets.includes(snippet.text) ? 'selected' : ''}`}
                          onClick={() => toggleSnippet(snippet.text)}
                        >
                          {snippet.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SnippetsSidePanel;
