import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [fontScale, setFontScale] = useState(1.0);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);

  // Dark mode — persisted in localStorage, respects OS preference on first load
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('neap-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
  }, [fontScale]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    if (darkMode && !highContrast) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('neap-dark-mode', String(darkMode));
  }, [darkMode, highContrast]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const increaseFont = () => setFontScale(prev => Math.min(prev + 0.15, 1.6));
  const decreaseFont = () => setFontScale(prev => Math.max(prev - 0.15, 0.85));

  return (
    <AccessibilityContext.Provider value={{
      fontScale,
      setFontScale,
      highContrast,
      toggleHighContrast,
      darkMode,
      toggleDarkMode,
      voiceOutputEnabled,
      setVoiceOutputEnabled,
      increaseFont,
      decreaseFont
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
