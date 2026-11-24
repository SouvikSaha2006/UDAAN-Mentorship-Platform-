import React, { useState, useRef } from 'react';
import {
  Volume2,
  Square,
  Mic,
  MicOff,
  BookOpen,
  FileText,
  Video,
  Sparkles,
  Copy,
  Check,
  ArrowDown,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';

export default function AssistiveLearningHubPage() {
  const { materials } = useAppData();
  const { settings, updateSetting, speakText, stopSpeaking, isSpeaking } = useAccessibility();
  const { showToast } = useToast();

  const [selectedMaterial, setSelectedMaterial] = useState(materials[0]);
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [speed, setSpeed] = useState(settings.ttsRate || 1);
  const [customText, setCustomText] = useState(materials[0]?.content || '');

  // Speech-to-Text state
  const [isListening, setIsListening] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState(
    'Study Note (Demo): Focus on normalization forms 1NF, 2NF, 3NF, and BCNF before Thursday’s DBMS lab.'
  );
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleSelectMaterial = (mat) => {
    stopSpeaking();
    setSelectedMaterial(mat);
    setCustomText(mat.content);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const ok = speakText(customText, speed);
    if (!ok) {
      showToast('Text-to-Speech is not supported in this browser.', 'warning');
    }
  };

  const handleSpeedChange = (val) => {
    const num = Number(val);
    setSpeed(num);
    updateSetting('ttsRate', num);
  };

  const toggleSpeechToText = () => {
    if (!speechSupported) {
      showToast('Browser Speech Recognition is unavailable; you can type notes directly below.', 'info');
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((r) => r[0].transcript)
        .join(' ');
      setVoiceNotes((prev) => `${prev}\n${transcript}`.trim());
    };
    rec.onerror = () => {
      setIsListening(false);
      showToast('Microphone permission unavailable in this preview; fallback editor remains active.', 'warning');
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const handleCopyNotes = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(voiceNotes);
      setCopied(true);
      showToast('Study notes copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-6 text-white shadow-elevated sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, #3b68f6 0%, transparent 42%), radial-gradient(circle at 85% 30%, #8b5cf6 0%, transparent 38%)',
          }}
          aria-hidden="true"
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-amber-200">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              UDAAN · Accessible Learning Hub
            </span>
            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Learn in a way that works for you.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              Explore accessible study materials, listen at your own pace, simplify reading, and capture ideas with voice or typed notes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#study-materials"
                className="inline-flex items-center gap-2 rounded-xl bg-royal-500 px-5 py-3 text-sm font-bold text-white shadow-elevated transition-colors hover:bg-royal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Explore study tools <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#study-notes"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Open study notes
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/20 bg-white/95 p-5 text-slate-900 shadow-elevated dark:bg-slate-900 dark:text-white sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
                    Your study space
                  </p>
                  <h2 className="mt-1 text-base font-extrabold">Accessible by design</h2>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 shrink-0 text-royal-600 dark:text-royal-400" aria-hidden="true" />
                  Listen with adjustable speech speed
                </li>
                <li className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                  Switch to simplified reading mode
                </li>
                <li className="flex items-center gap-3">
                  <Mic className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Dictate or type study notes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Material Selector */}
        <section id="study-materials" className="lg:col-span-4 space-y-3 scroll-mt-6">
          <div className="card-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400">
              Start learning
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-navy-950 dark:text-white">
              Study materials
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Choose a resource to read or listen to.
            </p>
          </div>
          {materials.map((mat) => {
            const active = selectedMaterial?.id === mat.id;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => handleSelectMaterial(mat)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  active
                    ? 'bg-royal-50 dark:bg-royal-950/50 border-royal-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-royal-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge variant={active ? 'info' : 'neutral'}>{mat.type}</Badge>
                  {mat.type.includes('Video') ? (
                    <Video className="w-4 h-4 text-royal-600" aria-hidden="true" />
                  ) : (
                    <FileText className="w-4 h-4 text-violet-600" aria-hidden="true" />
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{mat.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{mat.durationOrPages}</p>
              </button>
            );
          })}
        </section>

        {/* Reader & Speech Studio */}
        <div className="lg:col-span-8 space-y-6">
          {/* TTS Reader */}
          <section id="study-reader" className="card-surface scroll-mt-6 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedMaterial?.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedMaterial?.subject} · {selectedMaterial?.faculty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSimplifiedMode((v) => !v)}
                aria-pressed={simplifiedMode}
                className={`btn-secondary text-xs ${simplifiedMode ? 'border-royal-500 text-royal-700 dark:text-royal-300' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {simplifiedMode ? 'Standard View' : 'Simplified Reading Mode'}
              </button>
            </div>

            {/* Audio Controls */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSpeak}
                  disabled={!ttsSupported}
                  className="btn-primary text-xs"
                >
                  {isSpeaking ? (
                    <>
                      <Square className="w-4 h-4" /> Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" /> Listen (Text-to-Speech)
                    </>
                  )}
                </button>
                {!ttsSupported && (
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Speech synthesis unavailable in this browser.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="tts-speed" className="text-xs font-bold whitespace-nowrap">
                  Speed: {speed.toFixed(2)}x
                </label>
                <input
                  id="tts-speed"
                  type="range"
                  min="0.7"
                  max="1.6"
                  step="0.1"
                  value={speed}
                  onChange={(e) => handleSpeedChange(e.target.value)}
                  className="w-28 accent-royal-600"
                />
              </div>
            </div>

            {/* Reader Body */}
            <div
              className={`rounded-xl border border-slate-200 dark:border-slate-700 p-5 ${
                simplifiedMode
                  ? 'bg-amber-50/40 dark:bg-slate-800 text-base leading-loose tracking-wide max-w-2xl'
                  : 'bg-white dark:bg-slate-900 text-sm leading-relaxed'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400 mb-2">
                <BookOpen className="w-4 h-4" /> Captioned Transcript & Accessible Text
              </div>
              <p className="text-slate-800 dark:text-slate-100 whitespace-pre-line">{customText}</p>
            </div>
          </section>

          {/* Speech-to-Text Note Taker */}
          <section id="study-notes" className="card-surface scroll-mt-6 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Voice & Accessible Study Notes (Speech-to-Text)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {speechSupported
                    ? 'Dictate notes using your microphone or type directly below.'
                    : 'Microphone dictation is not supported in this browser; full keyboard note editing is active.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSpeechToText}
                  className={`btn-secondary text-xs ${isListening ? 'border-rose-500 text-rose-600' : ''}`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" /> Stop Dictation
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Start Dictation
                    </>
                  )}
                </button>
                <button type="button" onClick={handleCopyNotes} className="btn-ghost text-xs border border-slate-200 dark:border-slate-700">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
              </div>
            </div>

            <label htmlFor="voice-notes" className="sr-only">Accessible study notes editor</label>
            <textarea
              id="voice-notes"
              rows={4}
              value={voiceNotes}
              onChange={(e) => setVoiceNotes(e.target.value)}
              className="input-field"
              placeholder="Your dictated or typed study notes appear here..."
            />
          </section>
        </div>
      </div>
    </div>
  );
}
