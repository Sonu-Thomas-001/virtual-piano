'use client';

import React, { useMemo } from 'react';
import { ALL_88_KEYS } from '@/lib/notes';
import { PianoNote } from '@/types/piano';

interface MiniPianoNavigatorProps {
  baseOctave: number;
  visibleOctaves: number;
  activeNotes: Map<number, unknown>;
  onNavigateOctave: (octave: number) => void;
}

export function MiniPianoNavigator({
  baseOctave,
  visibleOctaves,
  activeNotes,
  onNavigateOctave,
}: MiniPianoNavigatorProps) {
  // 52 white keys in standard 88-key piano
  const whiteKeys = useMemo(() => ALL_88_KEYS.filter((k) => k.type === 'white'), []);
  const blackKeys = useMemo(() => ALL_88_KEYS.filter((k) => k.type === 'black'), []);

  // Calculate viewport boundaries across the 88 keys
  const { startKeyIndex, endKeyIndex } = useMemo(() => {
    if (visibleOctaves >= 7) {
      return { startKeyIndex: 0, endKeyIndex: ALL_88_KEYS.length - 1 };
    }

    const startMidi = Math.max(21, (baseOctave + 1) * 12);
    const endMidi = Math.min(108, startMidi + visibleOctaves * 12);

    const sIdx = ALL_88_KEYS.findIndex((k) => k.midi >= startMidi);
    const eIdx = ALL_88_KEYS.findIndex((k) => k.midi > endMidi);

    return {
      startKeyIndex: sIdx >= 0 ? sIdx : 0,
      endKeyIndex: eIdx >= 0 ? eIdx - 1 : ALL_88_KEYS.length - 1,
    };
  }, [baseOctave, visibleOctaves]);

  // Viewport percentage
  const leftPercent = Math.max(0, (startKeyIndex / ALL_88_KEYS.length) * 100);
  const widthPercent = Math.min(
    100 - leftPercent,
    Math.max(8, ((endKeyIndex - startKeyIndex + 1) / ALL_88_KEYS.length) * 100)
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));

    // Map ratio across octaves 1 to 6
    const targetOctave = Math.floor(1 + clickRatio * 6);
    onNavigateOctave(Math.max(1, Math.min(6, targetOctave)));
  };

  return (
    <div
      id="mini-piano-navigator"
      className="w-full bg-[#111114] border border-stone-800/80 rounded-lg p-1.5 flex flex-col gap-1 select-none shadow-inner"
    >
      {/* Top Labels Bar */}
      <div className="flex items-center justify-between px-1 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 inline-block animate-pulse"></span>
          <span>88-Key Studio Range</span>
        </span>
        <div className="flex items-center gap-3 text-stone-400">
          <span>A0 (27.5 Hz)</span>
          <span className="text-amber-400/80 font-bold">
            Viewing: C{baseOctave}–B{Math.min(7, baseOctave + visibleOctaves - 1)}
          </span>
          <span>C8 (4186 Hz)</span>
        </div>
      </div>

      {/* Miniature 88-Key Visualizer Canvas */}
      <div
        id="mini-piano-strip"
        onClick={handleClick}
        className="relative h-6 bg-stone-950 border border-stone-800 rounded flex cursor-pointer overflow-hidden group transition-all"
        title="Click anywhere to pan keyboard view across all 88 keys"
      >
        {/* White keys */}
        <div className="flex w-full h-full">
          {whiteKeys.map((key) => {
            const isSounding = activeNotes.has(key.midi);
            return (
              <div
                key={key.midi}
                className={`flex-1 border-r border-stone-800/40 transition-colors ${
                  isSounding
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'bg-[#e2dfd5] hover:bg-white'
                }`}
              />
            );
          })}
        </div>

        {/* Black keys overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {blackKeys.map((key) => {
            // Find preceding white key index
            const precedingWhiteKeys = ALL_88_KEYS.slice(
              0,
              ALL_88_KEYS.findIndex((k) => k.midi === key.midi)
            ).filter((k) => k.type === 'white').length;

            const leftPos = (precedingWhiteKeys / 52) * 100 - 0.5;
            const isSounding = activeNotes.has(key.midi);

            return (
              <div
                key={key.midi}
                style={{ left: `${leftPos}%`, width: '1.2%' }}
                className={`absolute top-0 h-[60%] rounded-b-xs transition-colors ${
                  isSounding
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)] z-20'
                    : 'bg-stone-900 border-x border-b border-stone-950 z-10'
                }`}
              />
            );
          })}
        </div>

        {/* Illuminated Active Viewport Frame */}
        <div
          id="mini-piano-viewport"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
          }}
          className="absolute top-0 bottom-0 border-2 border-amber-400 bg-amber-500/15 backdrop-brightness-125 rounded-xs pointer-events-none z-30 transition-all duration-150 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center justify-center"
        >
          <div className="w-1.5 h-3 rounded-full bg-amber-400/80 opacity-60"></div>
        </div>
      </div>

      {/* Octave Markers */}
      <div className="flex justify-between px-1 text-[8px] font-mono text-stone-400">
        <span>C1</span>
        <span>C2</span>
        <span className={baseOctave === 3 ? 'text-amber-400 font-bold' : ''}>C3</span>
        <span className={baseOctave === 4 ? 'text-amber-400 font-bold' : ''}>C4</span>
        <span className={baseOctave === 5 ? 'text-amber-400 font-bold' : ''}>C5</span>
        <span>C6</span>
        <span>C7</span>
        <span>C8</span>
      </div>
    </div>
  );
}
