'use client';

import React, { memo } from 'react';
import { PianoNote, KeyLabelDisplay } from '@/types/piano';

interface PianoKeyProps {
  note: PianoNote;
  isPressed: boolean;
  isSustained: boolean;
  keyboardShortcut?: string;
  keyLabelDisplay: KeyLabelDisplay;
  isScaleHighlight?: boolean;
  isPracticeTarget?: boolean;
  onNoteStart: (midi: number) => void;
  onNoteStop: (midi: number) => void;
}

export const PianoKey = memo(function PianoKey({
  note,
  isPressed,
  isSustained,
  keyboardShortcut,
  keyLabelDisplay,
  isScaleHighlight = false,
  isPracticeTarget = false,
  onNoteStart,
  onNoteStop,
}: PianoKeyProps) {
  const isBlack = note.type === 'black';

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onNoteStart(note.midi);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    onNoteStop(note.midi);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    // Enable glissando / swipe when mouse or touch pointer is held down
    if (e.buttons === 1) {
      onNoteStart(note.midi);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (isPressed) {
      onNoteStop(note.midi);
    }
  };

  // Label display logic
  const showNote = keyLabelDisplay === 'both' || keyLabelDisplay === 'notes';
  const showShortcut = (keyLabelDisplay === 'both' || keyLabelDisplay === 'shortcuts') && keyboardShortcut;

  const accessibleLabel = `Play ${note.name.replace('#', '-sharp ')}`;

  if (isBlack) {
    return (
      <button
        id={`key-black-${note.name}`}
        type="button"
        aria-label={accessibleLabel}
        aria-pressed={isPressed}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        className={`
          group relative z-20 select-none flex flex-col justify-end items-center pb-2.5 transition-all duration-75
          cursor-pointer touch-none outline-none focus-visible:ring-1 focus-visible:ring-amber-400
          w-7 sm:w-8 md:w-9 lg:w-10 h-36 sm:h-44 md:h-48 lg:h-52 -mx-3.5 sm:-mx-4 md:-mx-4.5 lg:-mx-5
          rounded-b-[4px]
          ${
            isPressed
              ? 'translate-y-1 bg-gradient-to-b from-[#18181a] via-[#101012] to-[#08080a] shadow-[0_2px_4px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(245,158,11,0.25)] border-b-2 border-amber-500/70'
              : 'bg-gradient-to-b from-[#2e2e32] via-[#1c1c1f] to-[#0f0f11] shadow-[2px_6px_10px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-3px_3px_rgba(0,0,0,0.6)] border-b-[3px] border-[#08080a] hover:from-[#3a3a3f] hover:via-[#242428]'
          }
          ${isSustained && !isPressed ? 'ring-1 ring-amber-400/40' : ''}
          ${isPracticeTarget ? 'ring-2 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.95)] z-30 animate-pulse' : ''}
        `}
      >
        {/* Scale highlight dot */}
        {isScaleHighlight && !isPracticeTarget && !isPressed && (
          <div className="absolute top-3 w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-[0_0_4px_rgba(245,158,11,0.8)] pointer-events-none" />
        )}

        {/* Practice target badge */}
        {isPracticeTarget && (
          <div className="absolute top-1 px-1 py-0.5 rounded bg-amber-400 text-[8px] font-bold text-stone-950 uppercase tracking-wider pointer-events-none">
            Target
          </div>
        )}

        {/* Subtle top edge specular reflection */}
        <div className="absolute top-0 left-[10%] right-[10%] h-[1.5px] bg-white/20 rounded-full pointer-events-none" />

        {/* Labels */}
        <div className="flex flex-col items-center gap-0.5 pointer-events-none">
          {showShortcut && (
            <span
              className={`
                px-1 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider rounded
                ${isPressed ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-white/10 text-stone-300'}
              `}
            >
              {keyboardShortcut}
            </span>
          )}
          {showNote && (
            <span
              className={`
                text-[10px] sm:text-[11px] font-medium tracking-tight
                ${isPressed ? 'text-amber-400 font-semibold' : 'text-stone-400 group-hover:text-stone-300'}
              `}
            >
              {note.name}
            </span>
          )}
        </div>
      </button>
    );
  }

  // White Key
  return (
    <button
      id={`key-white-${note.name}`}
      type="button"
      aria-label={accessibleLabel}
      aria-pressed={isPressed}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        group relative z-10 select-none flex-1 min-w-[34px] sm:min-w-[42px] md:min-w-[48px] lg:min-w-[54px]
        h-56 sm:h-64 md:h-72 lg:h-80 flex flex-col justify-end items-center pb-3 transition-all duration-75
        cursor-pointer touch-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400
        border-r border-stone-300/60 last:border-r-0 rounded-b-[6px]
        ${
          isPressed
            ? 'translate-y-1 bg-gradient-to-b from-[#e8e4dc] via-[#ddd7cd] to-[#d0c9bc] shadow-[inset_0_3px_6px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.4)] border-b-2 border-amber-500/80'
            : 'bg-gradient-to-b from-[#ffffff] via-[#faf8f5] to-[#ece7df] shadow-[0_5px_8px_rgba(0,0,0,0.25),inset_0_-4px_6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] border-b-[5px] border-[#c4bdb1] hover:to-[#e4dfd6]'
        }
        ${isSustained && !isPressed ? 'bg-gradient-to-b from-[#fdfbf7] to-[#e4e0d7] shadow-[inset_0_-2px_4px_rgba(245,158,11,0.2)]' : ''}
        ${isPracticeTarget ? 'ring-2 ring-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.85)] z-25 animate-pulse' : ''}
      `}
    >
      {/* Scale highlight dot */}
      {isScaleHighlight && !isPracticeTarget && !isPressed && (
        <div className="absolute top-4 w-2 h-2 rounded-full bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.7)] pointer-events-none" />
      )}

      {/* Practice target badge */}
      {isPracticeTarget && (
        <div className="absolute top-3 px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-bold text-stone-950 uppercase tracking-wider pointer-events-none shadow-sm">
          Play
        </div>
      )}

      {/* Subtle indicator strip on pressed */}
      {isPressed && (
        <div className="absolute bottom-1 w-3 h-1 bg-amber-500 rounded-full pointer-events-none" />
      )}

      {/* Labels */}
      <div className="flex flex-col items-center gap-1 pointer-events-none">
        {showShortcut && (
          <span
            className={`
              px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider rounded border
              ${
                isPressed
                  ? 'bg-amber-500 text-stone-950 border-amber-600 font-bold'
                  : 'bg-stone-100 text-stone-600 border-stone-200 group-hover:border-stone-300'
              }
            `}
          >
            {keyboardShortcut}
          </span>
        )}
        {showNote && (
          <span
            className={`
              text-[11px] sm:text-xs font-semibold tracking-tight
              ${isPressed ? 'text-amber-600 font-bold' : 'text-stone-600 group-hover:text-stone-800'}
            `}
          >
            {note.name}
          </span>
        )}
      </div>
    </button>
  );
});
