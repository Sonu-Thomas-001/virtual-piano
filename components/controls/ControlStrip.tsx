'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Square,
  ChevronDown,
  Sparkles,
  Minus,
  Plus,
  Radio,
  BookmarkCheck,
} from 'lucide-react';
import { InstrumentId, KeyLabelDisplay } from '@/types/piano';
import { AVAILABLE_INSTRUMENTS } from '@/lib/constants';

interface ControlStripProps {
  currentInstrument: InstrumentId;
  onSelectInstrument: (inst: InstrumentId) => void;
  baseOctave: number;
  visibleOctaves: number;
  onShiftOctave: (direction: -1 | 1) => void;
  onSelectVisibleOctaves: (octaves: number) => void;
  sustain: boolean;
  onToggleSustain: () => void;
  metronomeEnabled: boolean;
  metronomeBpm: number;
  metronomeBeat: number;
  onToggleMetronome: () => void;
  onChangeBpm: (delta: number) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingsCount: number;
  onOpenRecordingsModal: () => void;
  keyLabels: KeyLabelDisplay;
  onToggleKeyLabels: () => void;
}

export function ControlStrip({
  currentInstrument,
  onSelectInstrument,
  baseOctave,
  visibleOctaves,
  onShiftOctave,
  onSelectVisibleOctaves,
  sustain,
  onToggleSustain,
  metronomeEnabled,
  metronomeBpm,
  metronomeBeat,
  onToggleMetronome,
  onChangeBpm,
  isRecording,
  onStartRecording,
  onStopRecording,
  recordingsCount,
  onOpenRecordingsModal,
  keyLabels,
  onToggleKeyLabels,
}: ControlStripProps) {
  const [instrumentMenuOpen, setInstrumentMenuOpen] = useState(false);
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);

  const instRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (instRef.current && !instRef.current.contains(e.target as Node)) {
        setInstrumentMenuOpen(false);
      }
      if (rangeRef.current && !rangeRef.current.contains(e.target as Node)) {
        setRangeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentInstInfo = AVAILABLE_INSTRUMENTS.find((i) => i.id === currentInstrument);

  // Octave range label
  const startNote = `C${baseOctave}`;
  const endOctave = baseOctave + visibleOctaves - 1;
  const endNote = `B${endOctave}`;

  return (
    <div
      id="piano-control-strip"
      className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-stone-300"
    >
      {/* LEFT GROUP: Instrument selector & Range */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Instrument Dropdown */}
        <div className="relative" ref={instRef}>
          <button
            id="instrument-selector-button"
            type="button"
            onClick={() => setInstrumentMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 hover:border-stone-700 hover:bg-stone-800/80 transition-all text-stone-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">
              {currentInstInfo?.name || 'Grand Piano'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {instrumentMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#18181b] border border-stone-700/90 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-stone-400 tracking-wider">
                Select Instrument
              </div>
              <div className="flex flex-col gap-0.5">
                {AVAILABLE_INSTRUMENTS.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      onSelectInstrument(inst.id);
                      setInstrumentMenuOpen(false);
                    }}
                    className={`
                      flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors w-full
                      ${
                        currentInstrument === inst.id
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100'
                      }
                    `}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs truncate">{inst.name}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-stone-800 text-stone-400 font-mono">
                          {inst.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 line-clamp-1">
                        {inst.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Octave Shift Controls */}
        <div className="flex items-center rounded-lg bg-stone-900/90 border border-stone-800 p-0.5">
          <button
            id="octave-down-button"
            type="button"
            onClick={() => onShiftOctave(-1)}
            disabled={baseOctave <= 1}
            title="Octave Down (Key: Z)"
            className="p-1.5 rounded hover:bg-stone-800 text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="px-2 font-mono text-[11px] text-stone-300 flex items-center gap-1">
            <span className="text-stone-400 hidden sm:inline">OCT</span>
            <span className="text-amber-400 font-semibold">{startNote}–{endNote}</span>
          </div>

          <button
            id="octave-up-button"
            type="button"
            onClick={() => onShiftOctave(1)}
            disabled={baseOctave >= 6}
            title="Octave Up (Key: X)"
            className="p-1.5 rounded hover:bg-stone-800 text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Keyboard Size / Range Preset */}
        <div className="relative" ref={rangeRef}>
          <button
            id="keyboard-range-button"
            type="button"
            onClick={() => setRangeMenuOpen((v) => !v)}
            title="Select visible keyboard range"
            className="px-2.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 hover:border-stone-700 text-stone-300 font-mono text-[11px] flex items-center gap-1.5"
          >
            <span>{visibleOctaves >= 7 ? '88 Keys' : `${visibleOctaves} Octaves`}</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {rangeMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-36 bg-[#18181b] border border-stone-700 rounded-xl shadow-xl p-1 z-50">
              {[2, 3, 4, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    onSelectVisibleOctaves(num);
                    setRangeMenuOpen(false);
                  }}
                  className={`
                    w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors
                    ${visibleOctaves === num ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-stone-300 hover:bg-stone-800'}
                  `}
                >
                  {num >= 7 ? 'Full 88-Key' : `${num} Octaves`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT GROUP: Metronome, Record, Sustain, Labels */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Metronome */}
        <div className="flex items-center rounded-lg bg-stone-900/90 border border-stone-800 p-0.5">
          <button
            id="metronome-toggle-button"
            type="button"
            onClick={onToggleMetronome}
            title="Toggle Metronome (Key: M)"
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded transition-colors font-medium
              ${
                metronomeEnabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }
            `}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                metronomeEnabled ? (metronomeBeat === 0 ? 'text-red-400 scale-125' : 'text-amber-400') : ''
              } transition-transform`}
            />
            <span className="font-mono text-[11px]">{metronomeBpm} BPM</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeBpm(-5)}
            title="Decrease BPM"
            className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onChangeBpm(5)}
            title="Increase BPM"
            className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Record Button */}
        <button
          id="record-toggle-button"
          type="button"
          onClick={isRecording ? onStopRecording : onStartRecording}
          title="Record Performance (Key: R)"
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all
            ${
              isRecording
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:border-stone-700 hover:text-stone-100 hover:bg-stone-800'
            }
          `}
        >
          {isRecording ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>STOP</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>REC</span>
            </>
          )}
        </button>

        {/* Saved Recordings Library Trigger */}
        {recordingsCount > 0 && (
          <button
            id="recordings-library-button"
            type="button"
            onClick={onOpenRecordingsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-stone-100"
            title="View saved recordings"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono">Tracks ({recordingsCount})</span>
          </button>
        )}

        {/* Sustain Pedal Toggle Button */}
        <button
          id="sustain-strip-button"
          type="button"
          onClick={onToggleSustain}
          title="Sustain Pedal (Key: Spacebar)"
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-all
            ${
              sustain
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-stone-900/90 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }
          `}
        >
          <span
            className={`w-2 h-2 rounded-full ${sustain ? 'bg-amber-400 animate-pulse' : 'bg-stone-600'}`}
          />
          <span className="text-[11px] font-mono">PEDAL</span>
        </button>

        {/* Key Labels Quick Switch */}
        <button
          id="labels-toggle-button"
          type="button"
          onClick={onToggleKeyLabels}
          title="Cycle Key Labels (Both / Notes / Shortcuts / None)"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 text-[11px] font-mono"
        >
          <span>LABELS:</span>
          <span className="text-amber-400 capitalize">{keyLabels}</span>
        </button>
      </div>
    </div>
  );
}
