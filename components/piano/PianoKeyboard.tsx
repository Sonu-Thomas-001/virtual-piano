'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { PianoNote, ActiveNoteState, KeyLabelDisplay } from '@/types/piano';
import { PianoKey } from './PianoKey';

interface PianoKeyboardProps {
  visibleKeys: PianoNote[];
  activeNotes: Map<number, ActiveNoteState>;
  sustain: boolean;
  keyboardMapping: Map<string, string>;
  keyLabels: KeyLabelDisplay;
  baseOctave: number;
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
  onNoteStart,
  onNoteStop,
}: PianoKeyboardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      <div className="relative mx-auto max-w-full inline-flex flex-col bg-gradient-to-b from-[#141416] to-[#0a0a0c] p-2 sm:p-3 rounded-xl border border-stone-800/90 shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06)]">
        
        {/* Felt Red Strip at Keybed Junction (Acoustic Grand Piano signature felt) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-900 via-red-700 to-red-900 rounded-t-sm shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)] mb-[-1px] z-30" />

        {/* The Keys Row */}
        <div
          id="piano-keys-row"
          className="relative flex flex-row items-start min-w-max justify-start px-0.5"
        >
          {whiteKeyGroups.map(({ whiteKey, blackKey }) => {
            const isWhiteActive = activeNotes.has(whiteKey.midi);
            const isBlackActive = blackKey ? activeNotes.has(blackKey.midi) : false;

            const whiteShortcut = noteToShortcutMap.get(whiteKey.name);
            const blackShortcut = blackKey ? noteToShortcutMap.get(blackKey.name) : undefined;

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
                  onNoteStart={onNoteStart}
                  onNoteStop={onNoteStop}
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
                      onNoteStart={onNoteStart}
                      onNoteStop={onNoteStop}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lower Keybed Lip */}
        <div className="h-2 w-full bg-gradient-to-b from-[#0e0e10] to-[#060608] rounded-b-lg border-t border-stone-800/40 mt-0.5" />
      </div>
    </div>
  );
}
