'use client';

import React from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Trash2,
  Clock,
  Music2,
  Download,
} from 'lucide-react';
import { Recording } from '@/types/piano';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: Recording[];
  activePlaybackId: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  playbackProgressMs: number;
  playbackDurationMs: number;
  onPlay: (rec: Recording) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDelete: (id: string) => void;
}

export function RecordingModal({
  isOpen,
  onClose,
  recordings,
  activePlaybackId,
  isPlaying,
  isPaused,
  playbackProgressMs,
  playbackDurationMs,
  onPlay,
  onPause,
  onResume,
  onStop,
  onDelete,
}: RecordingModalProps) {
  if (!isOpen) return null;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExportJson = (rec: Recording) => {
    const jsonStr = JSON.stringify(rec, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rec.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="recordings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="recordings-modal-card"
        className="w-full max-w-lg bg-[#161619] border border-stone-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-stone-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base tracking-wide">Recorded Performances</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
              {recordings.length}
            </span>
          </div>
          <button
            id="close-recordings-modal"
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {recordings.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-500 text-sm">
              <Clock className="w-8 h-8 stroke-1 text-stone-600" />
              <p>No performances recorded yet.</p>
              <p className="text-xs text-stone-600">
                Click the <span className="text-red-400 font-mono">REC</span> button or press <kbd className="font-mono bg-stone-800 px-1 py-0.5 rounded">R</kbd> to record your playing!
              </p>
            </div>
          ) : (
            recordings.map((rec) => {
              const isCurrent = activePlaybackId === rec.id;
              const progressPct =
                isCurrent && playbackDurationMs > 0
                  ? Math.min(100, (playbackProgressMs / playbackDurationMs) * 100)
                  : 0;

              return (
                <div
                  key={rec.id}
                  className={`
                    p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all
                    ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm truncate text-stone-100">
                        {rec.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                        <span>{formatTime(rec.duration)}</span>
                        <span>•</span>
                        <span>{rec.events.length} notes</span>
                        <span>•</span>
                        <span>{new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {isCurrent && isPlaying && !isPaused ? (
                        <button
                          type="button"
                          onClick={onPause}
                          title="Pause"
                          className="p-2 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                        </button>
                      ) : isCurrent && isPaused ? (
                        <button
                          type="button"
                          onClick={onResume}
                          title="Resume"
                          className="p-2 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPlay(rec)}
                          title="Play"
                          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      {isCurrent && (
                        <button
                          type="button"
                          onClick={onStop}
                          title="Stop"
                          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                        >
                          <Square className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleExportJson(rec)}
                        title="Export JSON"
                        className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(rec.id)}
                        title="Delete recording"
                        className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Playback Scrub / Progress bar */}
                  {isCurrent && (
                    <div className="w-full flex flex-col gap-1 pt-1">
                      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-100"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-stone-400">
                        <span>{formatTime(playbackProgressMs)}</span>
                        <span>{formatTime(playbackDurationMs)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-800/80 pt-3 text-xs text-stone-400">
          <span>Saved to local browser storage</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
