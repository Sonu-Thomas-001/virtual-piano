'use client';

import React from 'react';

interface PianoPedalsProps {
  sustain: boolean;
  sostenuto?: boolean;
  softPedal?: boolean;
  onToggleSustain: () => void;
  onToggleSostenuto: () => void;
  onToggleSoftPedal: () => void;
}

export function PianoPedals({
  sustain,
  sostenuto = false,
  softPedal = false,
  onToggleSustain,
  onToggleSostenuto,
  onToggleSoftPedal,
}: PianoPedalsProps) {
  return (
    <div
      id="piano-pedal-hardware"
      className="flex items-center justify-center gap-3 sm:gap-6 bg-[#0f0f12] border border-stone-800/90 px-4 sm:px-6 py-2.5 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06)] select-none"
    >
      {/* 1. SOFT / UNA CORDA PEDAL */}
      <div className="flex flex-col items-center gap-1">
        <button
          id="pedal-soft-trigger"
          type="button"
          role="switch"
          aria-checked={softPedal}
          aria-label="Soft Pedal (Una Corda)"
          onClick={onToggleSoftPedal}
          className={`
            relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            w-11 sm:w-14 h-14 sm:h-16 rounded-xl flex flex-col items-center justify-end pb-1.5 transition-all duration-100
            ${
              softPedal
                ? 'translate-y-1.5 bg-gradient-to-b from-amber-700 via-amber-600 to-amber-900 shadow-[inset_0_3px_6px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.5)] border border-amber-500/80'
                : 'bg-gradient-to-b from-stone-600 via-stone-700 to-stone-900 shadow-[0_6px_12px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.3)] border border-stone-600/80 hover:from-stone-500'
            }
          `}
        >
          {/* Chrome top highlight */}
          <div className="absolute top-1.5 left-2 right-2 h-1 bg-white/30 rounded-full pointer-events-none" />

          {/* Status LED */}
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              softPedal ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b]' : 'bg-stone-950 border border-stone-800'
            }`}
          />
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider text-stone-300">
            SOFT
          </span>
          <span className="text-[8px] font-mono text-stone-500 hidden sm:inline">
            Una Corda
          </span>
        </div>
      </div>

      {/* 2. SOSTENUTO PEDAL */}
      <div className="flex flex-col items-center gap-1">
        <button
          id="pedal-sostenuto-trigger"
          type="button"
          role="switch"
          aria-checked={sostenuto}
          aria-label="Sostenuto Pedal"
          onClick={onToggleSostenuto}
          className={`
            relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            w-11 sm:w-14 h-14 sm:h-16 rounded-xl flex flex-col items-center justify-end pb-1.5 transition-all duration-100
            ${
              sostenuto
                ? 'translate-y-1.5 bg-gradient-to-b from-amber-700 via-amber-600 to-amber-900 shadow-[inset_0_3px_6px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.5)] border border-amber-500/80'
                : 'bg-gradient-to-b from-stone-600 via-stone-700 to-stone-900 shadow-[0_6px_12px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.3)] border border-stone-600/80 hover:from-stone-500'
            }
          `}
        >
          {/* Chrome top highlight */}
          <div className="absolute top-1.5 left-2 right-2 h-1 bg-white/30 rounded-full pointer-events-none" />

          {/* Status LED */}
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              sostenuto ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b]' : 'bg-stone-950 border border-stone-800'
            }`}
          />
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider text-stone-300">
            SOSTENUTO
          </span>
          <span className="text-[8px] font-mono text-stone-500 hidden sm:inline">
            Held Notes
          </span>
        </div>
      </div>

      {/* 3. DAMPER / SUSTAIN PEDAL */}
      <div className="flex flex-col items-center gap-1">
        <button
          id="pedal-sustain-trigger"
          type="button"
          role="switch"
          aria-checked={sustain}
          aria-label="Sustain Damper Pedal"
          onClick={onToggleSustain}
          className={`
            relative group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400
            w-12 sm:w-16 h-14 sm:h-16 rounded-xl flex flex-col items-center justify-end pb-1.5 transition-all duration-100
            ${
              sustain
                ? 'translate-y-1.5 bg-gradient-to-b from-amber-600 via-amber-500 to-amber-800 shadow-[inset_0_3px_6px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.5)] border border-amber-400'
                : 'bg-gradient-to-b from-stone-500 via-stone-600 to-stone-800 shadow-[0_6px_14px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.35)] border border-stone-500/80 hover:from-stone-400'
            }
          `}
        >
          {/* Chrome top highlight */}
          <div className="absolute top-1.5 left-2 right-2 h-1 bg-white/40 rounded-full pointer-events-none" />

          {/* Status LED */}
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              sustain ? 'bg-amber-300 shadow-[0_0_10px_#f59e0b]' : 'bg-stone-950 border border-stone-800'
            }`}
          />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-amber-400/90">
              SUSTAIN
            </span>
            <span
              className={`text-[8px] font-mono px-1 py-0.2 rounded ${
                sustain ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-stone-800 text-stone-400'
              }`}
            >
              {sustain ? 'ON' : 'OFF'}
            </span>
          </div>
          <span className="text-[8px] font-mono text-stone-400 hidden sm:inline">
            Spacebar / CC64
          </span>
        </div>
      </div>
    </div>
  );
}
