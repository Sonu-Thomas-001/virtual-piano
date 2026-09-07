'use client';

import React from 'react';
import {
  X,
  Volume2,
  Sliders,
  Keyboard,
  Eye,
  Radio,
  Clock,
  Check,
  Waves,
  Music2,
  Sparkles,
  AlertOctagon,
  RotateCcw,
} from 'lucide-react';
import { PianoSettings, KeyLabelDisplay, ReverbPreset } from '@/types/piano';
import { AVAILABLE_REVERBS, TUNING_PRESETS } from '@/lib/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PianoSettings;
  onUpdateSettings: (updater: Partial<PianoSettings>) => void;
  audioLatencyMs: number;
  midiStatus: string;
  midiDeviceName?: string;
  onReleaseAllNotes?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  audioLatencyMs,
  midiStatus,
  midiDeviceName,
  onReleaseAllNotes,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-xl bg-[#151518] border border-stone-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-5 text-stone-200 animate-in zoom-in-95 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base tracking-wide">Studio Engine Settings</h2>
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

        {/* Section 1: AUDIO & STUDIO FX ENGINE */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Acoustic Physical Modeling & FX</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex flex-col gap-3.5">
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

            {/* Brightness & Dynamics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-800">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300">Timbre Brightness</span>
                  <span className="font-mono text-stone-400">{settings.brightness ?? 55}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.brightness ?? 55}
                  onChange={(e) => onUpdateSettings({ brightness: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300">Touch Dynamics Curve</span>
                  <span className="font-mono text-stone-400">{settings.dynamics ?? 75}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.dynamics ?? 75}
                  onChange={(e) => onUpdateSettings({ dynamics: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Concert Pitch Tuning */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300">Master Concert Pitch (A4 Tuning)</span>
                <span className="font-mono text-amber-400 font-bold">{settings.tuningHz ?? 440} Hz</span>
              </div>
              <div className="flex items-center gap-1.5">
                {TUNING_PRESETS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => onUpdateSettings({ tuningHz: t.value })}
                    className={`flex-1 py-1 px-2 rounded-lg border text-xs font-mono transition-all ${
                      (settings.tuningHz ?? 440) === t.value
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-stone-800/80 border-stone-700/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="text-[10px] block opacity-70 truncate">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Band Equalizer */}
            <div className="flex flex-col gap-2 pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300">3-Band Master Equalizer</span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ eqLow: 0, eqMid: 0, eqHigh: 0 })}
                  className="text-[10px] text-stone-500 hover:text-stone-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset EQ</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Low */}
                <div className="flex flex-col gap-1 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400 font-mono">LOW (250Hz)</span>
                    <span className="text-stone-300 font-mono">{settings.eqLow ?? 0}dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={settings.eqLow ?? 0}
                    onChange={(e) => onUpdateSettings({ eqLow: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Mid */}
                <div className="flex flex-col gap-1 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400 font-mono">MID (1kHz)</span>
                    <span className="text-stone-300 font-mono">{settings.eqMid ?? 0}dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={settings.eqMid ?? 0}
                    onChange={(e) => onUpdateSettings({ eqMid: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* High */}
                <div className="flex flex-col gap-1 bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-stone-400 font-mono">HIGH (4kHz)</span>
                    <span className="text-stone-300 font-mono">{settings.eqHigh ?? 0}dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={settings.eqHigh ?? 0}
                    onChange={(e) => onUpdateSettings({ eqHigh: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Reverb Acoustics */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-amber-400" />
                  <span>Concert Hall Acoustic Space</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {AVAILABLE_REVERBS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onUpdateSettings({ reverb: r.id })}
                    className={`px-2 py-1.5 rounded-lg border text-xs text-center transition-all ${
                      settings.reverb === r.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Damper Resonance */}
            <div className="flex flex-col gap-1 pt-2 border-t border-stone-800">
              <div className="flex justify-between text-xs">
                <span className="text-stone-300">Damper Sympathetic Resonance</span>
                <span className="font-mono text-stone-400">{settings.damperResonance ?? 40}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.damperResonance ?? 40}
                onChange={(e) => onUpdateSettings({ damperResonance: parseInt(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: KEYBOARD & DISPLAY */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard & Visual HUD</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex flex-col gap-3">
            {/* Key Labeling */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-stone-300">Key Overlay Labels:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {labelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSettings({ keyLabels: opt.value })}
                    className={`px-2 py-1.5 rounded-lg border text-xs text-center transition-all ${
                      settings.keyLabels === opt.value
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: HARDWARE & MIDI ENGINE */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            <span>Hardware & Diagnostic Telemetry</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3.5 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">Audio Latency:</span>
              <span className="font-mono text-emerald-400">
                {audioLatencyMs > 0 ? `~${Math.round(audioLatencyMs * 1000)}ms` : '< 10ms'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-400">Web MIDI Interface:</span>
              <span className="font-mono text-stone-200">
                {midiStatus === 'connected' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {midiDeviceName || 'Connected'}
                  </span>
                ) : midiStatus === 'unsupported' ? (
                  <span className="text-stone-500">Not supported in this browser</span>
                ) : (
                  <span className="text-stone-400">Plug & Play Ready</span>
                )}
              </span>
            </div>

            {/* STUCK NOTE PANIC BUTTON */}
            {onReleaseAllNotes && (
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-stone-300 font-medium block">Audio Voice Reset</span>
                  <span className="text-[11px] text-stone-500">Immediately releases all voices and active notes</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onReleaseAllNotes();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-900/80 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  <span>Panic Reset</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-stone-800/80 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors text-xs"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
