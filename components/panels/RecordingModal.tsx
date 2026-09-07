'use client';

import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Trash2,
  Clock,
  Music2,
  Download,
  Repeat,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Recording } from '@/types/piano';
import { MidiExporter } from '@/lib/recording/MidiExporter';

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
  onExportMidi?: (rec: Recording) => void;
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
  onExportMidi,
}: RecordingModalProps) {
  const [expandedRollId, setExpandedRollId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExportMidi = (rec: Recording) => {
    if (onExportMidi) {
      onExportMidi(rec);
    } else {
      MidiExporter.downloadMidiFile(rec, rec.tempo || 120);
    }
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
        className="w-full max-w-2xl bg-[#161619] border border-stone-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 text-stone-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base tracking-wide">Studio Recordings & Piano Roll</h2>
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
        <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
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
              const isExpanded = expandedRollId === rec.id;
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
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Play / Pause / Resume */}
                      {isCurrent && isPlaying && !isPaused ? (
                        <button
                          type="button"
                          onClick={onPause}
                          title="Pause"
                          className="p-2 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                        </button>
                      ) : isCurrent && isPaused ? (
                        <button
                          type="button"
                          onClick={onResume}
                          title="Resume"
                          className="p-2 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPlay(rec)}
                          title="Play"
                          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      {isCurrent && (
                        <button
                          type="button"
                          onClick={onStop}
                          title="Stop"
                          className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer"
                        >
                          <Square className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      {/* Piano Roll toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedRollId(isExpanded ? null : rec.id)}
                        title={isExpanded ? 'Hide Piano Roll' : 'View Piano Roll timeline'}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-stone-800/80 text-stone-400 border-stone-700 hover:text-stone-200 hover:bg-stone-800'
                        }`}
                      >
                        {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>ROLL</span>
                      </button>

                      {/* MIDI Export Button */}
                      <button
                        type="button"
                        onClick={() => handleExportMidi(rec)}
                        title="Download Standard MIDI File (.mid)"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-mono font-medium transition-all cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.MID</span>
                      </button>

                      {/* JSON Export Button */}
                      <button
                        type="button"
                        onClick={() => handleExportJson(rec)}
                        title="Export JSON"
                        className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDelete(rec.id)}
                        title="Delete recording"
                        className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors cursor-pointer"
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

                  {/* Piano Roll Timeline View */}
                  {isExpanded && (
                    <div className="w-full mt-2 pt-2 border-t border-stone-800/80">
                      <div className="text-[10px] font-mono text-stone-400 mb-1 flex items-center justify-between">
                        <span>TIMELINE NOTE EVENTS ({rec.events.length})</span>
                        <span>0:00 → {formatTime(rec.duration)}</span>
                      </div>
                      <div className="relative w-full h-24 bg-[#0a0a0d] border border-stone-800/80 rounded-lg overflow-hidden p-1 select-none">
                        {/* Note blocks */}
                        {rec.events.map((ev, idx) => {
                          const leftPct = Math.min(96, Math.max(0, (ev.startTime / (rec.duration || 1)) * 100));
                          const noteDuration = (ev.endTime ? ev.endTime - ev.startTime : 300);
                          const widthPct = Math.max(2, Math.min(100 - leftPct, (noteDuration / (rec.duration || 1)) * 100));
                          // Map MIDI pitch 21..108 to bottom 0..100%
                          const bottomPct = Math.max(4, Math.min(88, ((ev.midi - 21) / 87) * 100));
                          const isCurrentlySounding = isCurrent && isPlaying && playbackProgressMs >= ev.startTime && playbackProgressMs <= (ev.endTime ?? ev.startTime + 400);

                          return (
                            <div
                              key={`${rec.id}-ev-${idx}`}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                bottom: `${bottomPct}%`,
                              }}
                              className={`
                                absolute h-2 rounded-xs transition-all pointer-events-none
                                ${
                                  isCurrentlySounding
                                    ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] z-20'
                                    : 'bg-amber-600/70 border border-amber-500/40'
                                }
                              `}
                              title={`${ev.note} @ ${Math.round(ev.startTime)}ms`}
                            />
                          );
                        })}

                        {/* Playhead line if currently playing */}
                        {isCurrent && isPlaying && (
                          <div
                            style={{ left: `${progressPct}%` }}
                            className="absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow-[0_0_6px_#f59e0b] z-30 pointer-events-none"
                          />
                        )}
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
