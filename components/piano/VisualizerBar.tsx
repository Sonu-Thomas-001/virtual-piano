'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '@/lib/audio/AudioEngine';

interface VisualizerBarProps {
  activeNotes?: Map<number, unknown>;
  activeNotesCount?: number;
  activeChordName: string | null;
  activeNoteNames: string[];
  audioEngineRef?: React.RefObject<AudioEngine | null>;
  sustain?: boolean;
  isRecording?: boolean;
  isPlaying?: boolean;
}

export function VisualizerBar({
  activeNotes,
  activeNotesCount,
  activeChordName,
  activeNoteNames,
  audioEngineRef,
  sustain = false,
  isRecording = false,
  isPlaying = false,
}: VisualizerBarProps) {
  const [activityLevel, setActivityLevel] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const notesCount = activeNotesCount ?? (activeNotes ? activeNotes.size : 0);

  useEffect(() => {
    const audioEngine = audioEngineRef?.current || AudioEngine.getInstance();

    const update = () => {
      const level = audioEngine.getAudioActivityLevel();
      // Combine active notes count and frequency energy
      const combined = Math.max(level, Math.min(1, notesCount * 0.2));
      setActivityLevel((prev) => prev * 0.75 + combined * 0.25);
      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [notesCount, audioEngineRef]);

  // Generate 24 rhythmic spectral columns
  const numBars = 28;
  const bars = Array.from({ length: numBars }, (_, i) => {
    // Harmonic curve peak in the middle
    const centerFactor = 1 - Math.abs(i - numBars / 2) / (numBars / 2);
    const wave = (Math.sin(i * 0.9) * 0.5 + 0.5) * 0.25;
    const heightRatio = Math.max(
      0.08,
      Math.min(1, activityLevel * (0.35 + centerFactor * 0.65) + (notesCount > 0 ? wave : 0))
    );
    return Math.round(heightRatio * 100);
  });

  return (
    <div
      id="visualizer-bar"
      className="w-full flex items-center justify-between px-3 py-1 bg-[#141417] border-y border-stone-800/60 text-xs text-stone-400 font-mono select-none"
    >
      {/* Left note/chord live readout */}
      <div className="flex items-center gap-2 min-w-[160px]">
        {activeChordName ? (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 tracking-wide text-xs">
            {activeChordName}
          </span>
        ) : activeNoteNames.length > 0 ? (
          <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700 text-xs">
            {activeNoteNames.slice(0, 4).join('  ·  ')}
            {activeNoteNames.length > 4 ? ` +${activeNoteNames.length - 4}` : ''}
          </span>
        ) : (
          <span className="text-[11px] text-stone-400">Play keys to sound</span>
        )}
      </div>

      {/* Center real-time spectrum visualizer */}
      <div className="flex items-center gap-0.5 h-4 max-w-xs w-full justify-center opacity-85">
        {bars.map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`w-1 rounded-full transition-all duration-75 ${
              notesCount > 0
                ? 'bg-gradient-to-t from-amber-600 to-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                : 'bg-stone-800'
            }`}
          />
        ))}
      </div>

      {/* Right polyphony readout */}
      <div className="flex items-center justify-end gap-2 min-w-[140px] text-[11px] text-stone-400">
        <span>Voices:</span>
        <span
          className={`font-semibold ${
            notesCount > 0 ? 'text-amber-400' : 'text-stone-400'
          }`}
        >
          {notesCount} active
        </span>
      </div>
    </div>
  );
}
