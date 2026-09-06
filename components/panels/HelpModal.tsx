'use client';

import React from 'react';
import { X, HelpCircle, Keyboard, Music, Play, Layers } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="help-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="help-modal-card"
        className="w-full max-w-xl bg-[#161619] border border-stone-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-stone-200 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base tracking-wide">Piano Controls & Shortcuts</h2>
          </div>
          <button
            id="close-help-modal"
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard Layout Visual Diagram */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
            Computer Keyboard Layout
          </span>

          {/* Graphical Key Matrix */}
          <div className="flex flex-col gap-1.5 items-center justify-center py-2">
            {/* Black keys row */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="w-8 text-center text-stone-600"></span>
              <kbd className="w-8 h-8 rounded bg-stone-950 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shadow-md">
                W
              </kbd>
              <kbd className="w-8 h-8 rounded bg-stone-950 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shadow-md">
                E
              </kbd>
              <span className="w-8 text-center text-stone-600"></span>
              <kbd className="w-8 h-8 rounded bg-stone-950 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shadow-md">
                T
              </kbd>
              <kbd className="w-8 h-8 rounded bg-stone-950 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shadow-md">
                Y
              </kbd>
              <kbd className="w-8 h-8 rounded bg-stone-950 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shadow-md">
                U
              </kbd>
              <span className="w-8 text-center text-stone-600"></span>
              <kbd className="w-8 h-8 rounded bg-stone-950 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shadow-md">
                O
              </kbd>
              <kbd className="w-8 h-8 rounded bg-stone-950 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shadow-md">
                P
              </kbd>
            </div>

            {/* White keys row */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                A
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                S
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                D
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                F
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                G
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                H
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                J
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                K
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                L
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                ;
              </kbd>
              <kbd className="w-8 h-9 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold flex items-center justify-center shadow">
                &apos;
              </kbd>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-stone-400 font-mono px-2 pt-1 border-t border-stone-800">
            <span>White keys: Natural tones</span>
            <span>Black keys: Sharps (#)</span>
          </div>
        </div>

        {/* Action Shortcuts Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <span className="text-stone-300">Sustain Damper Pedal</span>
            <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 font-mono text-amber-400 font-semibold">
              Spacebar
            </kbd>
          </div>

          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <span className="text-stone-300">Octave Down / Up</span>
            <div className="flex gap-1 font-mono">
              <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-amber-400 font-semibold">
                Z
              </kbd>
              <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-amber-400 font-semibold">
                X
              </kbd>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <span className="text-stone-300">Start / Stop Recording</span>
            <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 font-mono text-red-400 font-semibold">
              R
            </kbd>
          </div>

          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <span className="text-stone-300">Metronome Click</span>
            <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 font-mono text-amber-400 font-semibold">
              M
            </kbd>
          </div>

          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <span className="text-stone-300">Fullscreen Toggle</span>
            <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 font-mono text-stone-300">
              F
            </kbd>
          </div>

          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <span className="text-stone-300">Close Any Modal</span>
            <kbd className="px-2 py-1 rounded bg-stone-800 border border-stone-700 font-mono text-stone-300">
              Esc
            </kbd>
          </div>
        </div>

        {/* Touch & Mouse Playing Tips */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex flex-col gap-1">
          <span className="font-semibold text-amber-300">Touch & Mouse Glissando:</span>
          <p className="text-[11px] leading-relaxed text-amber-100/80">
            • Hold mouse down and drag across keys to slide smoothly (glissando).
            <br />
            • Supports multi-touch on iPad, tablet, and mobile screens to play full chords with multiple fingers simultaneously!
            <br />
            • Plug in any USB MIDI keyboard or synthesizer for instant plug-and-play response.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
