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
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
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
      <PageHeader
        badge="Assistive Learning Hub"
        title="Accessible Study Studio"
        description="Listen to study transcripts with adjustable reading speed, dictate voice notes, and switch to simplified reading mode."
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Material Selector */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Accessible Materials & Transcripts
          </h2>
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
        </div>

        {/* Reader & Speech Studio */}
        <div className="lg:col-span-8 space-y-6">
          {/* TTS Reader */}
          <div className="card-surface p-6 space-y-4">
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
          </div>

          {/* Speech-to-Text Note Taker */}
          <div className="card-surface p-6 space-y-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
