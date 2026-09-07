'use client';

import React from 'react';

interface ThreePedalBoardProps {
  sustain: boolean;
  sostenuto: boolean;
  softPedal: boolean;
  onToggleSustain: () => void;
  onToggleSostenuto: () => void;
  onToggleSoftPedal: () => void;
  compact?: boolean;
}

export function ThreePedalBoard({
  sustain,
  sostenuto,
  softPedal,
  onToggleSustain,
  onToggleSostenuto,
  onToggleSoftPedal,
  compact = false,
}: ThreePedalBoardProps) {
  return (
    <div
      id="three-pedal-lyre"
      className={`flex items-center gap-3 bg-[#121215]/95 backdrop-blur-md border border-stone-800/90 rounded-2xl shadow-2xl select-none transition-all ${
        compact ? 'px-3 py-1.5' : 'px-4 py-2.5'
      }`}
    >
      {/* 1. Soft Pedal (Una Corda) */}
      <div className="flex flex-col items-center">
        <button
          id="soft-pedal-button"
          type="button"
          role="switch"
          aria-checked={softPedal}
          aria-label="Soft Pedal (Una Corda)"
          onClick={onToggleSoftPedal}
          className={`
            relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            transition-all duration-100 flex flex-col items-center justify-end pb-1
            ${compact ? 'w-10 h-12 rounded-lg' : 'w-12 h-14 rounded-xl'}
            ${
              softPedal
                ? 'translate-y-1 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border border-amber-500/80 shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)]'
                : 'bg-gradient-to-b from-stone-500 via-stone-700 to-stone-800 border border-stone-600/80 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:from-stone-400'
            }
          `}
        >
          <div className="absolute top-1 left-1.5 right-1.5 h-0.5 bg-white/25 rounded-full pointer-events-none" />
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              softPedal ? 'bg-amber-300 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-stone-900/90'
            }`}
          />
        </button>
        <span className="text-[9px] font-mono tracking-wider text-stone-400 mt-1 uppercase font-medium">
          Soft
        </span>
      </div>

      {/* Center Sostenuto Pedal */}
      <div className="flex flex-col items-center">
        <button
          id="sostenuto-pedal-button"
          type="button"
          role="switch"
          aria-checked={sostenuto}
          aria-label="Sostenuto Pedal"
          onClick={onToggleSostenuto}
          className={`
            relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            transition-all duration-100 flex flex-col items-center justify-end pb-1
            ${compact ? 'w-10 h-12 rounded-lg' : 'w-12 h-14 rounded-xl'}
            ${
              sostenuto
                ? 'translate-y-1 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border border-amber-500/80 shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)]'
                : 'bg-gradient-to-b from-stone-500 via-stone-700 to-stone-800 border border-stone-600/80 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:from-stone-400'
            }
          `}
        >
          <div className="absolute top-1 left-1.5 right-1.5 h-0.5 bg-white/25 rounded-full pointer-events-none" />
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              sostenuto ? 'bg-amber-300 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-stone-900/90'
            }`}
          />
        </button>
        <span className="text-[9px] font-mono tracking-wider text-stone-400 mt-1 uppercase font-medium">
          Sost.
        </span>
      </div>

      {/* Right Damper (Sustain) Pedal */}
      <div className="flex flex-col items-center">
        <button
          id="damper-pedal-button"
          type="button"
          role="switch"
          aria-checked={sustain}
          aria-label="Damper / Sustain Pedal (Spacebar)"
          onClick={onToggleSustain}
          className={`
            relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            transition-all duration-100 flex flex-col items-center justify-end pb-1
            ${compact ? 'w-12 h-12 rounded-lg' : 'w-14 h-14 rounded-xl'}
            ${
              sustain
                ? 'translate-y-1 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 border border-amber-400 shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)]'
                : 'bg-gradient-to-b from-stone-400 via-stone-600 to-stone-800 border border-stone-500 shadow-[0_5px_10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:from-stone-300'
            }
          `}
        >
          <div className="absolute top-1 left-2 right-2 h-0.5 bg-white/30 rounded-full pointer-events-none" />
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              sustain ? 'bg-amber-200 shadow-[0_0_10px_rgba(251,191,36,1)]' : 'bg-stone-900/90'
            }`}
          />
        </button>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[9px] font-mono tracking-wider text-stone-300 uppercase font-semibold">
            Damper
          </span>
          <kbd className="text-[8px] px-1 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700 font-mono">
            Space
          </kbd>
        </div>
      </div>
    </div>
  );
}
