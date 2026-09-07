'use client';

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Music,
  Zap,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { PianoSettings, ReverbPreset } from '@/types/piano';
import { AVAILABLE_REVERBS } from '@/lib/constants';

interface PianoControlsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PianoSettings;
  updateSettings: (partial: Partial<PianoSettings>) => void;
  onPanicReset: () => void;
  audioLatencyMs?: number;
}

type TabType = 'acoustics' | 'space' | 'tuning';

export function PianoControlsDrawer({
  isOpen,
  onClose,
  settings,
  updateSettings,
  onPanicReset,
  audioLatencyMs = 8,
}: PianoControlsDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('acoustics');

  const brightness = settings.brightness ?? 55;
  const dynamics = settings.dynamics ?? 75;
  const damperResonance = settings.damperResonance ?? 40;
  const stereoWidth = settings.stereoWidth ?? 70;
  const eqLow = settings.eqLow ?? 0;
  const eqMid = settings.eqMid ?? 0;
  const eqHigh = settings.eqHigh ?? 0;
  const tuningHz = settings.tuningHz ?? 440;
  const transpose = settings.transpose ?? 0;
  const reverb = settings.reverb ?? 'hall';
  const volume = settings.volume ?? 0.8;
  const isMuted = settings.isMuted ?? false;

  if (!isOpen) return null;

  return (
    <div
      id="piano-controls-drawer"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md h-full bg-[#121216] border-l border-stone-800 shadow-2xl flex flex-col overflow-hidden text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-[#16161c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-stone-100">
                Studio Piano Controls
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                Acoustic Grand Modeling & Tone Parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Piano Controls"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-800 bg-[#141418] px-4 py-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('acoustics')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'acoustics'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Acoustics & Dynamics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('space')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'space'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Reverb & 3-Band EQ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tuning')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'tuning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Tuning & Master
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: ACOUSTICS & DYNAMICS */}
          {activeTab === 'acoustics' && (
            <div className="space-y-5">
              {/* Brightness Control */}
              <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <label htmlFor="ctrl-brightness" className="text-xs font-mono font-medium text-stone-300">
                    TIMBRE BRIGHTNESS
                  </label>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {brightness}%
                  </span>
                </div>
                <input
                  id="ctrl-brightness"
                  type="range"
                  min="10"
                  max="100"
                  value={brightness}
                  onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>Mellow / Felt</span>
                  <span>Natural Studio</span>
                  <span>Concert Crisp</span>
                </div>
              </div>

              {/* Dynamics Control */}
              <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <label htmlFor="ctrl-dynamics" className="text-xs font-mono font-medium text-stone-300">
                    TOUCH DYNAMICS CURVE
                  </label>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {dynamics}%
                  </span>
                </div>
                <input
                  id="ctrl-dynamics"
                  type="range"
                  min="20"
                  max="100"
                  value={dynamics}
                  onChange={(e) => updateSettings({ dynamics: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>Compressed</span>
                  <span>Balanced</span>
                  <span>Concert Grand Range</span>
                </div>
              </div>

              {/* Damper Resonance */}
              <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <label htmlFor="ctrl-resonance" className="text-xs font-mono font-medium text-stone-300">
                    DAMPER SOUNDBOARD RESONANCE
                  </label>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {damperResonance}%
                  </span>
                </div>
                <input
                  id="ctrl-resonance"
                  type="range"
                  min="0"
                  max="100"
                  value={damperResonance}
                  onChange={(e) => updateSettings({ damperResonance: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[10px] text-stone-400">
                  Emulates sympathetic string vibration and soundboard body wash when the sustain pedal is held.
                </p>
              </div>

              {/* Stereo Width */}
              <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <label htmlFor="ctrl-stereo-width" className="text-xs font-mono font-medium text-stone-300">
                    STEREO ACOUSTIC SPREAD
                  </label>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {stereoWidth}%
                  </span>
                </div>
                <input
                  id="ctrl-stereo-width"
                  type="range"
                  min="0"
                  max="100"
                  value={stereoWidth}
                  onChange={(e) => updateSettings({ stereoWidth: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>Mono Focus</span>
                  <span>Pianist Perspective</span>
                  <span>Wide Stage</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPACE & 3-BAND EQ */}
          {activeTab === 'space' && (
            <div className="space-y-5">
              {/* Reverb Presets */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-stone-300">
                    ACOUSTIC SPACE (REVERB)
                  </span>
                  <span className="text-xs font-mono text-amber-400 uppercase font-bold">
                    {reverb}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_REVERBS.map((rev) => (
                    <button
                      key={rev.id}
                      type="button"
                      onClick={() => updateSettings({ reverb: rev.id as ReverbPreset })}
                      className={`
                        p-2 rounded-lg text-xs font-mono text-center border transition-all cursor-pointer
                        ${
                          reverb === rev.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                            : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                        }
                      `}
                    >
                      <div className="font-semibold">{rev.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Band Equalizer */}
              <div className="space-y-4 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-stone-300">
                    3-BAND STUDIO EQUALIZER
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSettings({ eqLow: 0, eqMid: 0, eqHigh: 0 })}
                    className="flex items-center gap-1 text-[10px] font-mono text-stone-400 hover:text-amber-400 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset 0 dB
                  </button>
                </div>

                {/* EQ Low */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-stone-400">LOW (120 Hz Bass)</span>
                    <span className="text-amber-400 font-bold">{eqLow > 0 ? `+${eqLow}` : eqLow} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eqLow}
                    onChange={(e) => updateSettings({ eqLow: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* EQ Mid */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-stone-400">MID (1.2 kHz Body)</span>
                    <span className="text-amber-400 font-bold">{eqMid > 0 ? `+${eqMid}` : eqMid} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eqMid}
                    onChange={(e) => updateSettings({ eqMid: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* EQ High */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-stone-400">HIGH (6 kHz Air)</span>
                    <span className="text-amber-400 font-bold">{eqHigh > 0 ? `+${eqHigh}` : eqHigh} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={eqHigh}
                    onChange={(e) => updateSettings({ eqHigh: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TUNING & MASTER */}
          {activeTab === 'tuning' && (
            <div className="space-y-5">
              {/* Master Volume & Mute */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-stone-300">
                    MASTER AUDIO OUTPUT
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSettings({ isMuted: !isMuted })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:text-stone-100'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isMuted ? 'MUTED' : `${Math.round(volume * 100)}%`}</span>
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => updateSettings({ volume: Number(e.target.value), isMuted: false })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Master Tuning Hz */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-stone-300">
                    REFERENCE TUNING (A4 PITCH)
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {tuningHz} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="430"
                  max="450"
                  step="0.5"
                  value={tuningHz}
                  onChange={(e) => updateSettings({ tuningHz: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex gap-2">
                  {[432, 440, 442].map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      onClick={() => updateSettings({ tuningHz: hz })}
                      className={`flex-1 py-1 text-xs font-mono rounded border transition-all cursor-pointer ${
                        tuningHz === hz
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                      }`}
                    >
                      {hz} Hz
                    </button>
                  ))}
                </div>
              </div>

              {/* Transposition */}
              <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-stone-300">
                    PITCH TRANSPOSITION
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {transpose > 0 ? `+${transpose}` : transpose} st
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ transpose: Math.max(-12, transpose - 1) })}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs cursor-pointer"
                  >
                    -1
                  </button>
                  <div className="flex-1 text-center font-mono text-xs text-stone-300">
                    {transpose === 0 ? 'Concert Pitch (C)' : `${transpose} semitones`}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ transpose: Math.min(12, transpose + 1) })}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ transpose: 0 })}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs cursor-pointer"
                    title="Reset to 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Safe Panic / Stuck Note Recovery */}
              <div className="p-3.5 rounded-xl bg-stone-900/40 border border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-stone-300">
                    DIAGNOSTICS & PANIC RESET
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ~{audioLatencyMs}ms Latency
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onPanicReset}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all text-xs font-mono font-medium cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>KILL ALL SOUNDS / RESET STUCK NOTES</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-[#16161c] flex items-center justify-between text-xs text-stone-400">
          <span className="font-mono text-[11px]">VIRTUAL PIANO STUDIO PRO</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
