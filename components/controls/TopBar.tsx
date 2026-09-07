'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  Play,
  Piano,
  Activity,
  Sparkles,
  AlertOctagon,
  Layers,
  Sliders,
} from 'lucide-react';
import { InstrumentId } from '@/types/piano';
import { AVAILABLE_INSTRUMENTS } from '@/lib/constants';

interface TopBarProps {
  currentInstrument: InstrumentId;
  baseOctave: number;
  activeNoteNames: string[];
  activeChordName: string | null;
  isRecording: boolean;
  recordingDuration: number;
  isPlaying: boolean;
  audioStatusText: 'initializing' | 'ready' | 'waiting';
  midiStatus: 'unsupported' | 'disconnected' | 'connected' | 'requesting';
  midiDeviceName?: string;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSoundBrowser?: () => void;
  onOpenControlsDrawer?: () => void;
  onReleaseAllNotes?: () => void;
  performanceMode?: boolean;
  onTogglePerformanceMode?: () => void;
}

export function TopBar({
  currentInstrument,
  baseOctave,
  activeNoteNames,
  activeChordName,
  isRecording,
  recordingDuration,
  isPlaying,
  audioStatusText,
  midiStatus,
  midiDeviceName,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onOpenSettings,
  onOpenHelp,
  isFullscreen,
  onToggleFullscreen,
  onOpenSoundBrowser,
  onOpenControlsDrawer,
  onReleaseAllNotes,
  performanceMode = false,
  onTogglePerformanceMode,
}: TopBarProps) {
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setShowVolumePopup(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const currentInstObj = AVAILABLE_INSTRUMENTS.find((i) => i.id === currentInstrument);

  // Format recording timer: mm:ss
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine HUD status display
  let statusBadge: React.ReactNode = null;
  if (isRecording) {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-600/60 text-red-400 text-xs font-mono animate-pulse">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span>REC {formatTime(recordingDuration)}</span>
      </div>
    );
  } else if (isPlaying) {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 text-xs font-mono">
        <Play className="w-2.5 h-2.5 fill-emerald-400" />
        <span>PLAYBACK</span>
      </div>
    );
  } else if (audioStatusText === 'initializing') {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 text-xs font-mono">
        <Activity className="w-2.5 h-2.5 animate-spin" />
        <span>AUDIO INIT</span>
      </div>
    );
  } else {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 text-[11px] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>STUDIO READY</span>
      </div>
    );
  }

  return (
    <header
      id="top-navigation-bar"
      className="w-full bg-[#121214]/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-2.5 flex items-center justify-between gap-4 z-40"
    >
      {/* LEFT: Branding */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-stone-800 via-stone-900 to-[#0a0a0c] border border-stone-700/70 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <Piano className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wider text-stone-100 uppercase">
              Virtual Piano
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              PRO
            </span>
          </div>
          <span className="text-[11px] text-stone-400 tracking-normal hidden sm:inline">
            Digital Piano Studio
          </span>
        </div>
      </div>

      {/* CENTER: Current Playing Status & Note HUD */}
      <div className="flex items-center gap-2 sm:gap-4 max-w-md">
        {/* Status Pill */}
        <div className="hidden sm:block">{statusBadge}</div>

        {/* Note / Chord readout */}
        <div className="flex items-center gap-2 bg-[#0c0c0e] border border-stone-800/90 rounded-lg px-3 py-1 shadow-inner min-w-[130px] sm:min-w-[170px] justify-center">
          {activeNoteNames.length > 0 ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-amber-400 font-mono font-bold text-sm sm:text-base tracking-tight">
                {activeNoteNames.join(' · ')}
              </span>
              {activeChordName && (
                <span className="text-[11px] font-sans font-medium text-stone-300 bg-stone-800/90 px-1.5 py-0.5 rounded border border-stone-700">
                  {activeChordName}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-mono tracking-wide text-stone-400 uppercase">
              Ready to play
            </span>
          )}
        </div>

        {/* Instrument & Octave Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-300 text-xs font-mono">
          <span className="text-amber-400 font-medium">{currentInstObj?.name || 'Grand Piano'}</span>
          <span className="text-stone-600">•</span>
          <span>C{baseOctave}</span>
        </div>

        {/* MIDI Badge */}
        {midiStatus === 'connected' && (
          <div
            title={`MIDI Keyboard Connected: ${midiDeviceName || 'Ready'}`}
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>MIDI: {midiDeviceName ? midiDeviceName.slice(0, 10) : 'IN'}</span>
          </div>
        )}
      </div>

      {/* RIGHT: Master Volume, Settings, Help, Fullscreen */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Sound Library Button */}
        {onOpenSoundBrowser && (
          <button
            id="open-sound-browser-topbar"
            type="button"
            onClick={onOpenSoundBrowser}
            title="Browse All 37 Studio Voices"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sounds</span>
          </button>
        )}

        {/* Acoustics & Modeling Drawer */}
        {onOpenControlsDrawer && (
          <button
            id="open-fx-drawer-topbar"
            type="button"
            onClick={onOpenControlsDrawer}
            title="Piano Acoustics, EQ, Brightness, Reverb & Tuning"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 text-xs font-medium transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Acoustics</span>
          </button>
        )}

        {/* Performance / Stage Mode Toggle */}
        {onTogglePerformanceMode && (
          <button
            id="performance-mode-toggle"
            type="button"
            onClick={onTogglePerformanceMode}
            title={performanceMode ? 'Exit Performance Mode' : 'Enter Performance Mode (Focus on Piano)'}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              performanceMode
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{performanceMode ? 'Stage On' : 'Stage'}</span>
          </button>
        )}

        {/* Audio Panic / Stuck Note Killer */}
        {onReleaseAllNotes && (
          <button
            id="panic-reset-button"
            type="button"
            onClick={onReleaseAllNotes}
            title="Panic: Kill stuck notes and release all voices"
            className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/40 hover:border-red-800 border border-transparent transition-all"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>
        )}

        {/* Volume Control */}
        <div className="relative" ref={volumeRef}>
          <button
            id="volume-toggle-button"
            type="button"
            aria-label="Volume settings"
            onClick={() => setShowVolumePopup((v) => !v)}
            className="p-2 rounded-lg text-stone-300 hover:text-stone-100 hover:bg-stone-800/80 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-stone-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-stone-300" />
            )}
          </button>

          {/* Volume Popover */}
          {showVolumePopup && (
            <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-[#18181b] border border-stone-700 rounded-xl shadow-2xl flex flex-col gap-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-medium">Master Volume</span>
                <span className="font-mono text-stone-200">
                  {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  onVolumeChange(parseFloat(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-700 rounded-lg appearance-none"
              />
              <button
                type="button"
                onClick={onToggleMute}
                className="w-full py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              >
                {isMuted ? 'Unmute' : 'Mute Master'}
              </button>
            </div>
          )}
        </div>

        {/* Keyboard Help */}
        <button
          id="help-modal-trigger"
          type="button"
          aria-label="Keyboard Shortcuts"
          title="Keyboard Shortcuts & Help"
          onClick={onOpenHelp}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          id="settings-modal-trigger"
          type="button"
          aria-label="Settings"
          title="Studio Settings"
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          id="fullscreen-toggle-button"
          type="button"
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors hidden sm:inline-flex"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
