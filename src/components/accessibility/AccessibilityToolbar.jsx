import React from 'react';
import {
  Accessibility,
  X,
  Plus,
  Minus,
  Contrast,
  Moon,
  Sun,
  Link2,
  BookOpen,
  Type,
  Volume2,
  Square,
  MousePointerClick,
  Sparkles,
  Focus,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useToast } from '../../context/ToastContext';

export default function AccessibilityToolbar() {
  const {
    settings,
    toggleSetting,
    updateSetting,
    increaseFont,
    decreaseFont,
    resetSettings,
    speakText,
    stopSpeaking,
    isSpeaking,
    toolbarOpen,
    setToolbarOpen,
  } = useAccessibility();
  const { showToast } = useToast();

  const handleReadPage = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const mainEl = document.querySelector('main');
    const text = mainEl
      ? mainEl.innerText.slice(0, 750)
      : 'Welcome to UDAAN, Student Mentorship Platform For Specially Abled Students.';
    const ok = speakText(text);
    if (!ok) {
      showToast('Browser Text-to-Speech is not supported in this browser.', 'warning');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setToolbarOpen((o) => !o)}
        aria-label="Open Accessibility Toolbar"
        aria-expanded={toolbarOpen}
        className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-navy-900 dark:bg-royal-600 text-white px-4 py-3 shadow-elevated hover:bg-navy-800 dark:hover:bg-royal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 transition-all"
      >
        <Accessibility className="w-5 h-5" aria-hidden="true" />
        <span className="text-xs font-bold hidden sm:inline">Accessibility</span>
      </button>

      {toolbarOpen && (
        <aside
          aria-label="Accessibility Controls"
          className="fixed bottom-20 left-5 z-50 w-[min(92vw,390px)] max-h-[78vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-elevated p-5"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-royal-600 dark:text-royal-400" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  UDAAN Accessibility Suite
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Preferences save automatically
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToolbarOpen(false)}
              aria-label="Close accessibility toolbar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            {/* Visual */}
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Visual</p>
              <div className="flex items-center justify-between gap-2 mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Text Size ({Math.round(settings.fontScale * 100)}%)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={decreaseFont}
                    aria-label="Decrease font size"
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={increaseFont}
                    aria-label="Increase font size"
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ToggleTile
                  active={settings.darkMode}
                  onClick={() => toggleSetting('darkMode')}
                  icon={settings.darkMode ? Sun : Moon}
                  label={settings.darkMode ? 'Light Mode' : 'Dark Mode'}
                />
                <ToggleTile
                  active={settings.highContrast}
                  onClick={() => toggleSetting('highContrast')}
                  icon={Contrast}
                  label="High Contrast"
                />
                <ToggleTile
                  active={settings.highlightLinks}
                  onClick={() => toggleSetting('highlightLinks')}
                  icon={Link2}
                  label="Highlight Links"
                />
                <ToggleTile
                  active={settings.readingMode}
                  onClick={() => toggleSetting('readingMode')}
                  icon={BookOpen}
                  label="Reading Mode"
                />
              </div>
            </div>

            {/* Reading & Speech */}
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Reading & Audio</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <ToggleTile
                  active={settings.dyslexiaFont}
                  onClick={() => toggleSetting('dyslexiaFont')}
                  icon={Type}
                  label="Dyslexia Font"
                />
                <ToggleTile
                  active={settings.lineSpacing > 1.6}
                  onClick={() =>
                    updateSetting('lineSpacing', settings.lineSpacing > 1.6 ? 1.6 : 2.0)
                  }
                  icon={BookOpen}
                  label="Wide Line Space"
                />
              </div>
              <button
                type="button"
                onClick={handleReadPage}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 font-semibold bg-royal-50 text-royal-700 dark:bg-royal-950/60 dark:text-royal-300 border border-royal-200 dark:border-royal-800 hover:bg-royal-100"
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-4 h-4" /> Stop Page Reader
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" /> Read Current Page Aloud
                  </>
                )}
              </button>
            </div>

            {/* Motor & Hearing */}
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Motor & Hearing</p>
              <div className="grid grid-cols-2 gap-2">
                <ToggleTile
                  active={settings.largeControls}
                  onClick={() => toggleSetting('largeControls')}
                  icon={MousePointerClick}
                  label="Large Controls"
                />
                <ToggleTile
                  active={settings.reducedMotion}
                  onClick={() => toggleSetting('reducedMotion')}
                  icon={Sparkles}
                  label="Reduced Motion"
                />
                <ToggleTile
                  active={settings.focusEnhanced}
                  onClick={() => toggleSetting('focusEnhanced')}
                  icon={Focus}
                  label="Strong Focus Ring"
                />
                <ToggleTile
                  active={settings.captionMode}
                  onClick={() => toggleSetting('captionMode')}
                  icon={Check}
                  label="Captions Always On"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  resetSettings();
                  stopSpeaking();
                  showToast('Accessibility settings reset to defaults.', 'info');
                }}
                className="btn-ghost text-xs px-2.5 py-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset All
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Accessibility preferences saved to your browser.', 'success');
                  setToolbarOpen(false);
                }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                Save & Close
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}

function ToggleTile({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold border transition-all ${
        active
          ? 'bg-royal-600 text-white border-royal-600 shadow-sm'
          : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}
