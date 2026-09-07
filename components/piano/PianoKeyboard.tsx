'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { PianoNote, ActiveNoteState, KeyLabelDisplay } from '@/types/piano';
import { getScalePitchClasses } from '@/lib/notes';
import { PianoKey } from './PianoKey';

interface PianoKeyboardProps {
  visibleKeys: PianoNote[];
  activeNotes: Map<number, ActiveNoteState>;
  sustain: boolean;
  keyboardMapping: Map<string, string>;
  keyLabels: KeyLabelDisplay;
  baseOctave: number;
  activeScale?: string;
  practiceTargetMidi?: number | null;
  onNoteStart: (midi: number, velocity?: number, source?: 'mouse' | 'touch') => void;
  onNoteStop: (midi: number, source?: 'mouse' | 'touch') => void;
}

export function PianoKeyboard({
  visibleKeys,
  activeNotes,
  sustain,
  keyboardMapping,
  keyLabels,
  baseOctave,
  activeScale = 'none',
  practiceTargetMidi = null,
  onNoteStart,
  onNoteStop,
}: PianoKeyboardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Pitch classes in currently active scale
  const scalePitchClasses = useMemo(() => {
    return getScalePitchClasses(activeScale);
  }, [activeScale]);

  // Group keys: separate white keys and associate any following black key
  const whiteKeyGroups = React.useMemo(() => {
    const groups: { whiteKey: PianoNote; blackKey?: PianoNote }[] = [];

    for (let i = 0; i < visibleKeys.length; i++) {
      const key = visibleKeys[i];
      if (key.type === 'white') {
        // Look ahead for adjacent black key
        const nextKey = visibleKeys[i + 1];
        if (nextKey && nextKey.type === 'black') {
          groups.push({ whiteKey: key, blackKey: nextKey });
          i++; // Skip the black key in the loop since it's paired
        } else {
          groups.push({ whiteKey: key });
        }
      }
    }
    return groups;
  }, [visibleKeys]);

  // Reverse mapping for fast shortcut lookup: noteName -> shortcut letter
  const noteToShortcutMap = React.useMemo(() => {
    const map = new Map<string, string>();
    keyboardMapping.forEach((noteName, shortcut) => {
      map.set(noteName, shortcut);
    });
    return map;
  }, [keyboardMapping]);

  // Handle multi-touch on mobile/tablet without stuck notes
  const activeTouchesRef = useRef<Map<number, number>>(new Map()); // touchId -> midi

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const keyElement = element?.closest('[data-midi]');
        if (keyElement) {
          const midi = parseInt(keyElement.getAttribute('data-midi') || '0', 10);
          if (midi > 0) {
            activeTouchesRef.current.set(touch.identifier, midi);
            onNoteStart(midi, 0.85, 'touch');
          }
        }
      }
    },
    [onNoteStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const keyElement = element?.closest('[data-midi]');
        const previousMidi = activeTouchesRef.current.get(touch.identifier);

        if (keyElement) {
          const newMidi = parseInt(keyElement.getAttribute('data-midi') || '0', 10);
          if (newMidi > 0 && newMidi !== previousMidi) {
            if (previousMidi) {
              onNoteStop(previousMidi, 'touch');
            }
            activeTouchesRef.current.set(touch.identifier, newMidi);
            onNoteStart(newMidi, 0.85, 'touch');
          }
        } else if (previousMidi) {
          onNoteStop(previousMidi, 'touch');
          activeTouchesRef.current.delete(touch.identifier);
        }
      }
    },
    [onNoteStart, onNoteStop]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const midi = activeTouchesRef.current.get(touch.identifier);
        if (midi) {
          onNoteStop(midi, 'touch');
          activeTouchesRef.current.delete(touch.identifier);
        }
      }
    },
    [onNoteStop]
  );

  // Auto-scroll into view when baseOctave changes if scrollable
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const targetKeyEl = scrollContainerRef.current.querySelector(`#key-white-C${baseOctave}`);
    if (targetKeyEl) {
      targetKeyEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [baseOctave]);

  return (
    <div
      id="piano-keyboard-container"
      className="relative w-full overflow-x-auto overflow-y-hidden pb-4 pt-2 select-none no-scrollbar touch-none"
      ref={scrollContainerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Keyboard Case Bed / Wood & Metal Trim */}
      <div className="relative mx-auto max-w-full inline-flex flex-col bg-gradient-to-b from-[#18181c] via-[#121215] to-[#070709] p-2.5 sm:p-4 rounded-2xl border border-stone-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)]">
        
        {/* Top Fallboard & Brand Inlay */}
        <div className="flex items-center justify-between px-3 py-1 mb-1.5 border-b border-stone-800/60 text-stone-500">
          <div className="w-8 sm:w-16 h-1 bg-stone-800 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shadow-[0_0_6px_#f59e0b]" />
            <span className="font-mono text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] text-amber-500/90 font-bold uppercase">
              VIRTUAL PIANO STUDIO · CONCERT MASTER
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shadow-[0_0_6px_#f59e0b]" />
          </div>
          <div className="w-8 sm:w-16 h-1 bg-stone-800 rounded-full" />
        </div>

        {/* Felt Red Strip at Keybed Junction (Acoustic Grand Piano signature felt) */}
        <div className="h-2 w-full bg-gradient-to-r from-red-950 via-red-800 to-red-950 rounded-t-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_1px_2px_rgba(0,0,0,0.8)] mb-[-1px] z-30 border-b border-red-900/40" />

        {/* The Keys Row with side cheeks */}
        <div className="relative flex items-stretch">
          {/* Left Wood Cheek Block */}
          <div className="w-3 sm:w-4 bg-gradient-to-r from-[#1c1c22] to-[#121216] rounded-l-md border-r border-stone-900 shadow-[inset_1px_0_1px_rgba(255,255,255,0.06)] shrink-0 z-20" />

          <div
            id="piano-keys-row"
            className="relative flex flex-row items-start min-w-max justify-start px-0.5"
          >
          {whiteKeyGroups.map(({ whiteKey, blackKey }) => {
            const isWhiteActive = activeNotes.has(whiteKey.midi);
            const isBlackActive = blackKey ? activeNotes.has(blackKey.midi) : false;

            const whiteShortcut = noteToShortcutMap.get(whiteKey.name);
            const blackShortcut = blackKey ? noteToShortcutMap.get(blackKey.name) : undefined;

            const isWhiteInScale = scalePitchClasses.has(whiteKey.noteName);
            const isWhitePracticeTarget = practiceTargetMidi === whiteKey.midi;

            const isBlackInScale = blackKey ? scalePitchClasses.has(blackKey.noteName) : false;
            const isBlackPracticeTarget = blackKey ? practiceTargetMidi === blackKey.midi : false;

            return (
              <div
                key={whiteKey.midi}
                data-midi={whiteKey.midi}
                className="relative flex-shrink-0 flex items-start"
              >
                {/* White Key */}
                <PianoKey
                  note={whiteKey}
                  isPressed={isWhiteActive}
                  isSustained={sustain}
                  keyboardShortcut={whiteShortcut}
                  keyLabelDisplay={keyLabels}
                  isScaleHighlight={isWhiteInScale}
                  isPracticeTarget={isWhitePracticeTarget}
                  onNoteStart={(midi, vel) => onNoteStart(midi, vel, 'mouse')}
                  onNoteStop={(midi) => onNoteStop(midi, 'mouse')}
                />

                {/* Attached Black Key (Centered on the seam with translate-x-1/2) */}
                {blackKey && (
                  <div
                    data-midi={blackKey.midi}
                    className="absolute top-0 right-0 translate-x-1/2 z-20"
                  >
                    <PianoKey
                      note={blackKey}
                      isPressed={isBlackActive}
                      isSustained={sustain}
                      keyboardShortcut={blackShortcut}
                      keyLabelDisplay={keyLabels}
                      isScaleHighlight={isBlackInScale}
                      isPracticeTarget={isBlackPracticeTarget}
                      onNoteStart={(midi, vel) => onNoteStart(midi, vel, 'mouse')}
                      onNoteStop={(midi) => onNoteStop(midi, 'mouse')}
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Right Wood Cheek Block */}
          <div className="w-3 sm:w-4 bg-gradient-to-l from-[#1c1c22] to-[#121216] rounded-r-md border-l border-stone-900 shadow-[inset_-1px_0_1px_rgba(255,255,255,0.06)] shrink-0 z-20" />
        </div>

        {/* Lower Keybed Lip */}
        <div className="h-2 w-full bg-gradient-to-b from-[#0e0e10] to-[#060608] rounded-b-lg border-t border-stone-800/40 mt-0.5" />
      </div>
    </div>
  );
}
