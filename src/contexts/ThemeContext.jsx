import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEMES = [
  { value: 'clinical-blue', label: 'Clinical Blue' },
  { value: 'slate', label: 'Slate Professional' },
  { value: 'warm', label: 'Warm Neutral' },
  { value: 'navy', label: 'Navy Professional' },
  { value: 'ultra-light', label: 'Ultra-Light Clinical' }
];

const DEFAULT_TECHNICIANS = [
  { name: 'Tech 1', pod: 'A' },
  { name: 'Tech 2', pod: 'A' },
  { name: 'Tech 3', pod: 'B' },
  { name: 'Tech 4', pod: 'B' },
  { name: 'Tech 5', pod: 'C' },
  { name: 'Tech 6', pod: 'C' }
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hd-theme') || 'clinical-blue';
  });

  const [technicians, setTechnicians] = useState(() => {
    const saved = localStorage.getItem('hd-technicians');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Return saved if not empty, otherwise use defaults
      return parsed.length > 0 ? parsed : DEFAULT_TECHNICIANS;
    }
    return DEFAULT_TECHNICIANS;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hd-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('hd-technicians', JSON.stringify(technicians));
  }, [technicians]);

  const addTechnician = (name, pod) => {
    setTechnicians(prev => [...prev, { name, pod }]);
  };

  const removeTechnician = (name) => {
    setTechnicians(prev => prev.filter(t => t.name !== name));
  };

  const clearAllTechnicians = () => {
    setTechnicians([]);
  };

  const value = {
    theme,
    setTheme,
    themes: THEMES,
    technicians,
    addTechnician,
    removeTechnician,
    clearAllTechnicians,
    setTechnicians
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
