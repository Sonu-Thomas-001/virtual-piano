'use client';

import React from 'react';
import {
  X,
  Volume2,
  Sliders,
  Sparkles,
  Keyboard,
  Eye,
  Radio,
  Clock,
  Check,
} from 'lucide-react';
import { PianoSettings, InstrumentId, KeyLabelDisplay } from '@/types/piano';
import { AVAILABLE_INSTRUMENTS } from '@/lib/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PianoSettings;
  onUpdateSettings: (updater: Partial<PianoSettings>) => void;
  audioLatencyMs: number;
  midiStatus: string;
  midiDeviceName?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  audioLatencyMs,
  midiStatus,
  midiDeviceName,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const labelOptions: { value: KeyLabelDisplay; label: string }[] = [
    { value: 'both', label: 'Notes & Shortcuts' },
    { value: 'notes', label: 'Notes Only' },
    { value: 'shortcuts', label: 'Shortcuts Only' },
    { value: 'none', label: 'No Labels' },
  ];

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-lg bg-[#161619] border border-stone-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-5 text-stone-200 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base tracking-wide">Studio Settings</h2>
          </div>
          <button
            id="close-settings-modal"
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: AUDIO */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio Configuration</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex flex-col gap-3">
            {/* Master Volume */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-stone-300">Master Volume</span>
                <span className="font-mono text-stone-400">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.volume}
                onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Instrument Selection */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-stone-800">
              <span className="text-xs text-stone-300">Active Sound Model</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {AVAILABLE_INSTRUMENTS.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => onUpdateSettings({ instrument: inst.id })}
                    className={`
                      px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between
                      ${
                        settings.instrument === inst.id
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium'
                          : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
                      }
                    `}
                  >
                    <span className="truncate">{inst.name}</span>
                    {settings.instrument === inst.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Latency & Engine Stats */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-[11px] font-mono text-stone-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Base Audio Latency:</span>
              </div>
              <span className="text-emerald-400 font-semibold">{audioLatencyMs * 1000} ms</span>
            </div>
          </div>
        </div>

        {/* Section 2: KEYBOARD & DISPLAY */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard & Key Labels</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex flex-col gap-3">
            <span className="text-xs text-stone-300">Key Face Visual Labels</span>
            <div className="grid grid-cols-2 gap-2">
              {labelOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSettings({ keyLabels: opt.value })}
                  className={`
                    p-2 rounded-lg border text-xs text-center transition-all
                    ${
                      settings.keyLabels === opt.value
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium'
                        : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Visible Octaves */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-xs text-stone-300">
              <span>Visible Keyboard Width:</span>
              <div className="flex gap-1">
                {[2, 3, 4, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onUpdateSettings({ visibleOctaves: num })}
                    className={`
                      px-2 py-1 rounded text-[11px] font-mono border
                      ${
                        settings.visibleOctaves === num
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-stone-800 border-stone-700 text-stone-400'
                      }
                    `}
                  >
                    {num >= 7 ? '88 Keys' : `${num} Oct`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: METRONOME & MIDI */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            <span>Metronome & External MIDI</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>Default Tempo:</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-amber-400 font-bold">{settings.metronomeBpm} BPM</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-xs text-stone-300">
              <span>Web MIDI Status:</span>
              <span className="font-mono text-[11px] text-stone-400">
                {midiStatus === 'connected'
                  ? `Connected (${midiDeviceName || 'Ready'})`
                  : midiStatus === 'unsupported'
                  ? 'Unsupported in this browser'
                  : 'Ready (No hardware detected)'}
              </span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
