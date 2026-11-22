import React from 'react';
import {
  Eye,
  BookOpen,
  MousePointerClick,
  Ear,
  RotateCcw,
  Save,
  Volume2,
  Square,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';

export default function AccessibilitySettingsPage() {
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
  } = useAccessibility();
  const { showToast } = useToast();

  const handleSave = () => {
    showToast('All accessibility preferences saved to localStorage!', 'success');
  };

  const handleReset = () => {
    resetSettings();
    stopSpeaking();
    showToast('Accessibility settings restored to defaults.', 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="WCAG 2.2 AA Personalization"
        title="Accessibility Settings"
        description="Customize visual contrast, reading typography, motor controls, and hearing notifications across the entire UDAAN platform."
        actions={
          <>
            <button type="button" onClick={handleReset} className="btn-secondary">
              <RotateCcw className="w-4 h-4" /> Reset Defaults
            </button>
            <button type="button" onClick={handleSave} className="btn-primary">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Visual */}
        <section className="card-surface p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-royal-600" /> Visual Accessibility
          </h2>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Font Size Scale</p>
              <p className="text-xs text-slate-500">Current: {Math.round(settings.fontScale * 100)}%</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={decreaseFont} className="btn-secondary px-3 py-1.5 text-xs">
                A-
              </button>
              <button type="button" onClick={increaseFont} className="btn-secondary px-3 py-1.5 text-xs">
                A+
              </button>
            </div>
          </div>

          <SettingRow
            label="Dark Mode"
            description="Reduces screen glare in low-light study environments."
            checked={settings.darkMode}
            onChange={() => toggleSetting('darkMode')}
          />
          <SettingRow
            label="High Contrast Mode"
            description="Applies maximum black/white/yellow contrast borders."
            checked={settings.highContrast}
            onChange={() => toggleSetting('highContrast')}
          />
          <SettingRow
            label="Highlight Interactive Links"
            description="Adds high-visibility underline and border around links."
            checked={settings.highlightLinks}
            onChange={() => toggleSetting('highlightLinks')}
          />
        </section>

        {/* Reading */}
        <section className="card-surface p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" /> Reading & Speech
          </h2>

          <SettingRow
            label="Dyslexia-Friendly Font & Spacing"
            description="Increases letter/word spacing and switches to high-legibility fonts."
            checked={settings.dyslexiaFont}
            onChange={() => toggleSetting('dyslexiaFont')}
          />
          <SettingRow
            label="Focused Reading Mode"
            description="Applies warm paper background and centered readable line lengths."
            checked={settings.readingMode}
            onChange={() => toggleSetting('readingMode')}
          />

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <label htmlFor="line-space-range">Line Spacing</label>
              <span>{settings.lineSpacing.toFixed(1)}x</span>
            </div>
            <input
              id="line-space-range"
              type="range"
              min="1.4"
              max="2.2"
              step="0.2"
              value={settings.lineSpacing}
              onChange={(e) => updateSetting('lineSpacing', Number(e.target.value))}
              className="w-full accent-royal-600"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Test Text-to-Speech Voice</p>
              <p className="text-xs text-slate-500">Speed: {settings.ttsRate}x</p>
            </div>
            <button
              type="button"
              onClick={() =>
                isSpeaking
                  ? stopSpeaking()
                  : speakText('Welcome to UDAAN. Empowering Abilities. Enabling Futures.')
              }
              className="btn-secondary text-xs"
            >
              {isSpeaking ? (
                <>
                  <Square className="w-4 h-4" /> Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" /> Test Audio
                </>
              )}
            </button>
          </div>
        </section>

        {/* Motor */}
        <section className="card-surface p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-emerald-600" /> Motor & Navigation
          </h2>
          <SettingRow
            label="Large Clickable Controls"
            description="Enforces 44px+ minimum target height on buttons and form inputs."
            checked={settings.largeControls}
            onChange={() => toggleSetting('largeControls')}
          />
          <SettingRow
            label="Reduced Motion"
            description="Disables decorative transitions and animations across pages."
            checked={settings.reducedMotion}
            onChange={() => toggleSetting('reducedMotion')}
          />
          <SettingRow
            label="Enhanced Focus Indicators"
            description="Displays thick high-contrast amber/blue focus outlines for keyboard users."
            checked={settings.focusEnhanced}
            onChange={() => toggleSetting('focusEnhanced')}
          />
        </section>

        {/* Hearing */}
        <section className="card-surface p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ear className="w-5 h-5 text-amber-600" /> Hearing & Communication
          </h2>
          <SettingRow
            label="Written Visual Notifications"
            description="Ensures every status alert renders clear written toast banners."
            checked={settings.writtenNotifications}
            onChange={() => toggleSetting('writtenNotifications')}
          />
          <SettingRow
            label="Prefer Captioned Video & Transcripts"
            description="Prioritizes captioned mentorship sessions and text transcripts."
            checked={settings.captionMode}
            onChange={() => toggleSetting('captionMode')}
          />
        </section>
      </div>
    </div>
  );
}

function SettingRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-royal-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
