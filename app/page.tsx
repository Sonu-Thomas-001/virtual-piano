'use client';

import React, { useState, useEffect } from 'react';
import { usePiano } from '@/hooks/usePiano';
import { useFullscreen } from '@/hooks/useFullscreen';
import { TopBar } from '@/components/controls/TopBar';
import { ControlStrip } from '@/components/controls/ControlStrip';
import { PianoKeyboard } from '@/components/piano/PianoKeyboard';
import { VisualizerBar } from '@/components/piano/VisualizerBar';
import { PracticeModeOverlay } from '@/components/piano/PracticeModeOverlay';
import { MiniPianoNavigator } from '@/components/piano/MiniPianoNavigator';
import { PianoPedals } from '@/components/pedals/PianoPedals';
import { RecordingModal } from '@/components/panels/RecordingModal';
import { SettingsModal } from '@/components/panels/SettingsModal';
import { HelpModal } from '@/components/panels/HelpModal';
import { SoundBrowserModal } from '@/components/panels/SoundBrowserModal';
import { PianoControlsDrawer } from '@/components/controls/PianoControlsDrawer';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { Layers, X } from 'lucide-react';

export default function PianoStudioPage() {
  const {
    settings,
    updateSettings,
    isAudioReady,
    audioStatusText,
    ensureAudioUnlocked,
    releaseAllNotes,
    activeNotes,
    activeNoteNames,
    activeChordName,
    visibleKeys,
    keyboardMapping,
    // Three-Pedal System
    sustain,
    sostenuto,
    softPedal,
    toggleSustain,
    toggleSostenuto,
    toggleSoftPedal,
    // Metronome
    metronomeBeat,
    toggleMetronome,
    changeMetronomeBpm,
    shiftOctave,
    // Recording
    isRecording,
    recordingDuration,
    recordings,
    startRecording,
    stopRecording,
    deleteRecording,
    exportMidi,
    // Playback
    isPlaying,
    isPaused,
    activePlaybackId,
    playbackProgressMs,
    playbackDurationMs,
    playRecording,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    // Sound Library
    selectInstrument,
    toggleFavoriteSound,
    previewSound,
    // MIDI
    midiStatus,
    midiDeviceName,
    // Note triggers
    handleNoteStart,
    handleNoteStop,
    isMouseDownRef,
    // Practice Mode
    practiceSteps,
    practiceCurrentStepIndex,
    currentPracticeTarget,
    practiceCompleted,
    resetPractice,
    nextPracticeScale,
    // Tools & FX
    tapTempo,
    panOctave,
    audioEngineRef,
  } = usePiano();

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Modals state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [recordingsOpen, setRecordingsOpen] = useState(false);
  const [soundBrowserOpen, setSoundBrowserOpen] = useState(false);
  const [controlsDrawerOpen, setControlsDrawerOpen] = useState(false);

  // Performance / Stage Mode state (distraction-free grand piano immersion)
  const [performanceMode, setPerformanceMode] = useState(false);

  // Stuck note protection on window blur / tab hide
  useEffect(() => {
    const handleBlur = () => {
      releaseAllNotes();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        releaseAllNotes();
      }
    };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [releaseAllNotes]);

  // Esc key listener to close modals or exit performance mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen || helpOpen || recordingsOpen || soundBrowserOpen || controlsDrawerOpen) {
          setSettingsOpen(false);
          setHelpOpen(false);
          setRecordingsOpen(false);
          setSoundBrowserOpen(false);
          setControlsDrawerOpen(false);
        } else if (performanceMode) {
          setPerformanceMode(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, helpOpen, recordingsOpen, soundBrowserOpen, controlsDrawerOpen, performanceMode]);

  // Cycle key label displays
  const handleToggleKeyLabels = () => {
    const sequence: ('both' | 'notes' | 'shortcuts' | 'none')[] = ['both', 'notes', 'shortcuts', 'none'];
    const currentIndex = sequence.indexOf(settings.keyLabels);
    const nextIndex = (currentIndex + 1) % sequence.length;
    updateSettings({ keyLabels: sequence[nextIndex] });
  };

  return (
    <div
      id="piano-studio-root"
      className="min-h-screen w-full bg-[#0a0a0c] text-stone-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500/30"
      onClick={ensureAudioUnlocked}
    >
      {/* 1. TOP BAR */}
      <TopBar
        currentInstrument={settings.instrument}
        baseOctave={settings.baseOctave}
        activeNoteNames={activeNoteNames}
        activeChordName={activeChordName}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        isPlaying={isPlaying}
        audioStatusText={audioStatusText}
        midiStatus={midiStatus}
        midiDeviceName={midiDeviceName}
        volume={settings.volume}
        isMuted={settings.isMuted}
        onVolumeChange={(val) => updateSettings({ volume: val, isMuted: false })}
        onToggleMute={() => updateSettings({ isMuted: !settings.isMuted })}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenSoundBrowser={() => setSoundBrowserOpen(true)}
        onOpenControlsDrawer={() => setControlsDrawerOpen(true)}
        onReleaseAllNotes={releaseAllNotes}
        performanceMode={performanceMode}
        onTogglePerformanceMode={() => setPerformanceMode((v) => !v)}
      />

      {/* STAGE PERFORMANCE MODE BANNER (When Active) */}
      {performanceMode && (
        <div className="w-full bg-gradient-to-r from-purple-950/70 via-stone-900/90 to-purple-950/70 border-b border-purple-800/40 px-4 py-1.5 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Performance Stage Mode</span>
            <span className="text-stone-400 hidden sm:inline">• Pure piano focus & maximum key depth</span>
          </div>
          <button
            type="button"
            onClick={() => setPerformanceMode(false)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-900/50 hover:bg-purple-800/80 text-purple-200 border border-purple-700/50 transition-colors text-[11px]"
          >
            <span>Exit Stage Mode (Esc)</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. MAIN PIANO WORKSPACE */}
      <main
        id="main-piano-workspace"
        className="flex-1 w-full flex flex-col items-center justify-between py-2 px-2 sm:px-6 max-w-7xl mx-auto gap-2"
      >
        {/* Studio Real-Time Spectrum & Activity Visualizer Bar (Hidden in Performance Mode) */}
        {!performanceMode && (
          <VisualizerBar
            activeNotes={activeNotes}
            activeChordName={activeChordName}
            activeNoteNames={activeNoteNames}
            audioEngineRef={audioEngineRef}
            sustain={sustain}
            isRecording={isRecording}
            isPlaying={isPlaying}
          />
        )}

        {/* Compact Studio Control Strip (Hidden in Performance Mode) */}
        {!performanceMode && (
          <div className="w-full">
            <ControlStrip
              currentInstrument={settings.instrument}
              onSelectInstrument={(inst) => selectInstrument(inst)}
              baseOctave={settings.baseOctave}
              visibleOctaves={settings.visibleOctaves}
              onShiftOctave={shiftOctave}
              onSelectVisibleOctaves={(oct) => updateSettings({ visibleOctaves: oct })}
              sustain={sustain}
              onToggleSustain={toggleSustain}
              metronomeEnabled={settings.metronomeEnabled}
              metronomeBpm={settings.metronomeBpm}
              metronomeBeat={metronomeBeat}
              onToggleMetronome={toggleMetronome}
              onChangeBpm={changeMetronomeBpm}
              onTapTempo={tapTempo}
              isRecording={isRecording}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              recordingsCount={recordings.length}
              onOpenRecordingsModal={() => setRecordingsOpen(true)}
              keyLabels={settings.keyLabels}
              onToggleKeyLabels={handleToggleKeyLabels}
              transpose={settings.transpose ?? 0}
              onChangeTranspose={(tr) => updateSettings({ transpose: tr })}
              reverb={settings.reverb ?? 'off'}
              onSelectReverb={(rev) => updateSettings({ reverb: rev })}
              activeScale={settings.activeScale ?? 'none'}
              onSelectScale={(sc) => updateSettings({ activeScale: sc })}
              practiceMode={Boolean(settings.practiceMode)}
              onTogglePracticeMode={() => updateSettings({ practiceMode: !settings.practiceMode })}
              onOpenSoundBrowser={() => setSoundBrowserOpen(true)}
              onReleaseAllNotes={releaseAllNotes}
            />
          </div>
        )}

        {/* Practice Mode Interactive Trainer Bar (Conditional) */}
        {!performanceMode && settings.practiceMode && (
          <PracticeModeOverlay
            practiceScale={settings.practiceScale || 'c-major'}
            practiceSteps={practiceSteps}
            practiceCurrentStepIndex={practiceCurrentStepIndex}
            practiceCompleted={practiceCompleted}
            onReset={resetPractice}
            onNextScale={nextPracticeScale}
            onClose={() => updateSettings({ practiceMode: false })}
          />
        )}

        {/* Real Piano Keyboard Area */}
        <div
          className={`w-full flex justify-center transition-all ${
            performanceMode ? 'my-auto py-4 sm:py-8' : 'my-auto py-1 sm:py-2'
          }`}
        >
          <PianoKeyboard
            visibleKeys={visibleKeys}
            activeNotes={activeNotes}
            sustain={sustain}
            keyboardMapping={keyboardMapping}
            keyLabels={settings.keyLabels}
            baseOctave={settings.baseOctave}
            activeScale={settings.activeScale}
            practiceTargetMidi={settings.practiceMode && !performanceMode ? currentPracticeTarget?.midi : null}
            onNoteStart={handleNoteStart}
            onNoteStop={handleNoteStop}
          />
        </div>

        {/* Mini 88-Key Navigator & Viewport Slider */}
        <MiniPianoNavigator
          baseOctave={settings.baseOctave}
          visibleOctaves={settings.visibleOctaves}
          onNavigateOctave={(oct) => panOctave(oct)}
          activeNotes={activeNotes}
        />

        {/* Bottom Utility Bar: Three-Pedal System & Shortcuts Hint */}
        <div className="w-full flex items-center justify-between px-2 pt-2 pb-2 gap-4 flex-wrap">
          {/* Quick shortcuts hint */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-stone-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">A–K</kbd> Play Keys
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">Z/X</kbd> Octave
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">Space</kbd> Sustain
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">R</kbd> Record
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">M</kbd> Metronome
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">Esc</kbd> Voice Reset
            </span>
          </div>

          {/* Realistic Concert Three-Pedal System (Una Corda, Sostenuto, Sustain) */}
          <div className="mx-auto sm:ml-auto sm:mr-0">
            <PianoPedals
              sustain={sustain}
              sostenuto={sostenuto}
              softPedal={softPedal}
              onToggleSustain={toggleSustain}
              onToggleSostenuto={toggleSostenuto}
              onToggleSoftPedal={toggleSoftPedal}
            />
          </div>
        </div>
      </main>

      {/* 3. MODALS */}
      {/* Dedicated Sound Library Browser Modal */}
      <SoundBrowserModal
        isOpen={soundBrowserOpen}
        onClose={() => setSoundBrowserOpen(false)}
        currentInstrument={settings.instrument}
        onSelectInstrument={(id) => selectInstrument(id)}
        favoriteSounds={settings.favoriteSounds}
        onToggleFavorite={toggleFavoriteSound}
        recentSounds={settings.recentSounds}
        onPreviewSound={previewSound}
      />

      {/* Recordings & MIDI Export Modal */}
      <RecordingModal
        isOpen={recordingsOpen}
        onClose={() => setRecordingsOpen(false)}
        recordings={recordings}
        activePlaybackId={activePlaybackId}
        isPlaying={isPlaying}
        isPaused={isPaused}
        playbackProgressMs={playbackProgressMs}
        playbackDurationMs={playbackDurationMs}
        onPlay={playRecording}
        onPause={pausePlayback}
        onResume={resumePlayback}
        onStop={stopPlayback}
        onDelete={deleteRecording}
        onExportMidi={exportMidi}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        audioLatencyMs={AudioEngine.getInstance().getLatency()}
        midiStatus={midiStatus}
        midiDeviceName={midiDeviceName}
        onReleaseAllNotes={releaseAllNotes}
      />

      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Advanced Studio Acoustics & Modeling Drawer */}
      <PianoControlsDrawer
        isOpen={controlsDrawerOpen}
        onClose={() => setControlsDrawerOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
        onPanicReset={releaseAllNotes}
        audioLatencyMs={AudioEngine.getInstance().getLatency()}
      />
    </div>
  );
}
