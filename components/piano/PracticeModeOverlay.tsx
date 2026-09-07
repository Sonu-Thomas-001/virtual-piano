'use client';

import React from 'react';
import { PracticeStep } from '@/lib/notes';
import { Check, RotateCcw, ArrowRight, X, GraduationCap } from 'lucide-react';
import { SCALES_LIST } from '@/lib/constants';

interface PracticeModeOverlayProps {
  practiceScale: string;
  practiceSteps: PracticeStep[];
  practiceCurrentStepIndex: number;
  practiceCompleted: boolean;
  onReset: () => void;
  onNextScale: () => void;
  onClose: () => void;
}

export function PracticeModeOverlay({
  practiceScale,
  practiceSteps,
  practiceCurrentStepIndex,
  practiceCompleted,
  onReset,
  onNextScale,
  onClose,
}: PracticeModeOverlayProps) {
  const currentScaleDef = SCALES_LIST.find((s) => s.id === practiceScale) || SCALES_LIST[1];
  const targetStep = practiceSteps[practiceCurrentStepIndex];

  return (
    <div
      id="practice-mode-overlay"
      className="w-full bg-[#18181c] border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-stone-200 shadow-md animate-in slide-in-from-top-2"
    >
      {/* Scale & instructions */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-amber-300">
              Practice Mode: {currentScaleDef.name}
            </span>
            {practiceCompleted && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                ✓ Scale Completed!
              </span>
            )}
          </div>
          <span className="text-[11px] text-stone-400">
            {practiceCompleted
              ? 'Excellent job! Repeat or advance to the next scale exercise.'
              : targetStep
              ? `Press target note on piano: ${targetStep.name}`
              : 'Follow the illuminated target note'}
          </span>
        </div>
      </div>

      {/* Steps visual track */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-md no-scrollbar">
        {practiceSteps.map((step, idx) => {
          const isPassed = idx < practiceCurrentStepIndex || practiceCompleted;
          const isCurrent = idx === practiceCurrentStepIndex && !practiceCompleted;

          return (
            <div
              key={`${step.midi}-${idx}`}
              className={`flex items-center justify-center px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
                isPassed
                  ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                  : isCurrent
                  ? 'bg-amber-500 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-110 font-bold'
                  : 'bg-stone-900 border border-stone-800 text-stone-400'
              }`}
            >
              {isPassed ? <Check className="w-3 h-3 mr-0.5" /> : null}
              {step.name}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
          title="Restart Scale Exercise"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restart</span>
        </button>

        <button
          type="button"
          onClick={onNextScale}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-colors shadow-sm"
          title="Switch to Next Scale"
        >
          <span>Next Scale</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          title="Exit Practice Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
