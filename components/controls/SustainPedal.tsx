'use client';

import React from 'react';

interface SustainPedalProps {
  sustain: boolean;
  onToggleSustain: () => void;
}

export function SustainPedal({ sustain, onToggleSustain }: SustainPedalProps) {
  return (
    <div
      id="sustain-pedal-wrapper"
      className="flex items-center gap-3 bg-[#111114]/90 backdrop-blur-sm border border-stone-800/80 px-3.5 py-2 rounded-2xl shadow-xl select-none"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-semibold tracking-wider text-stone-200">
            DAMPER PEDAL
          </span>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
              sustain
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            {sustain ? 'LATCHED' : 'OFF'}
          </span>
        </div>
        <span className="text-[10px] text-stone-400 font-mono">
          Press <kbd className="px-1 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">Space</kbd> or click
        </span>
      </div>

      {/* Realistic Brass / Chrome Piano Foot Pedal */}
      <button
        id="sustain-pedal-trigger"
        type="button"
        role="switch"
        aria-checked={sustain}
        aria-label="Sustain Pedal"
        onClick={onToggleSustain}
        className={`
          relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400
          w-14 h-16 rounded-xl flex flex-col items-center justify-end pb-1.5 transition-all duration-100
          ${
            sustain
              ? 'translate-y-1 bg-gradient-to-b from-amber-700 via-amber-600 to-amber-800 shadow-[inset_0_3px_5px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.4)] border border-amber-500/80'
              : 'bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 shadow-[0_6px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-stone-600 hover:from-stone-500'
          }
        `}
      >
        {/* Metal highlight strip */}
        <div className="absolute top-1.5 left-2 right-2 h-1 bg-white/30 rounded-full pointer-events-none" />

        {/* Status LED glow on the pedal */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            sustain
              ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b]'
              : 'bg-stone-900 border border-stone-700'
          }`}
        />
      </button>
    </div>
  );
}
