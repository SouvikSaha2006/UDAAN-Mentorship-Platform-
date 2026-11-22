import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';

const DEFAULT_A11Y_SETTINGS = {
  fontScale: 1,
  darkMode: false,
  highContrast: false,
  highlightLinks: false,
  dyslexiaFont: false,
  readingMode: false,
  lineSpacing: 1.6,
  largeControls: false,
  reducedMotion: false,
  focusEnhanced: false,
  writtenNotifications: true,
  captionMode: true,
  ttsRate: 1,
};

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = storageService.get('accessibility', null);
    return saved ? { ...DEFAULT_A11Y_SETTINGS, ...saved } : DEFAULT_A11Y_SETTINGS;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);

  useEffect(() => {
    storageService.set('accessibility', settings);
    const root = document.documentElement;
    root.style.setProperty('--udaan-font-scale', String(settings.fontScale));
    root.style.setProperty('--udaan-line-height', String(settings.lineSpacing));

    root.classList.toggle('dark', Boolean(settings.darkMode));
    root.classList.toggle('high-contrast', Boolean(settings.highContrast));
    root.classList.toggle('highlight-links', Boolean(settings.highlightLinks));
    root.classList.toggle('dyslexia-font', Boolean(settings.dyslexiaFont));
    root.classList.toggle('reading-mode', Boolean(settings.readingMode));
    root.classList.toggle('line-spacing-relaxed', settings.lineSpacing > 1.6);
    root.classList.toggle('large-controls', Boolean(settings.largeControls));
    root.classList.toggle('reduced-motion', Boolean(settings.reducedMotion));
    root.classList.toggle('focus-enhanced', Boolean(settings.focusEnhanced));
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSetting = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const increaseFont = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fontScale: Math.min(1.35, Number((prev.fontScale + 0.08).toFixed(2))),
    }));
  }, []);

  const decreaseFont = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fontScale: Math.max(0.85, Number((prev.fontScale - 0.08).toFixed(2))),
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_A11Y_SETTINGS);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text, rateOverride) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return false;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rateOverride ?? settings.ttsRate;
      utterance.lang = 'en-IN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [settings.ttsRate]
  );

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        toggleSetting,
        increaseFont,
        decreaseFont,
        resetSettings,
        speakText,
        stopSpeaking,
        isSpeaking,
        toolbarOpen,
        setToolbarOpen,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
