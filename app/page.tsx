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
import { SustainPedal } from '@/components/controls/SustainPedal';
import { RecordingModal } from '@/components/panels/RecordingModal';
import { SettingsModal } from '@/components/panels/SettingsModal';
import { HelpModal } from '@/components/panels/HelpModal';
import { AudioEngine } from '@/lib/audio/AudioEngine';

export default function PianoStudioPage() {
  const {
    settings,
    updateSettings,
    isAudioReady,
    audioStatusText,
    ensureAudioUnlocked,
    activeNotes,
    activeNoteNames,
    activeChordName,
    visibleKeys,
    keyboardMapping,
    sustain,
    toggleSustain,
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

  // Esc key listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setHelpOpen(false);
        setRecordingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      />

      {/* 2. MAIN PIANO WORKSPACE */}
      <main
        id="main-piano-workspace"
        className="flex-1 w-full flex flex-col items-center justify-between py-2 px-2 sm:px-6 max-w-7xl mx-auto gap-2"
      >
        {/* Studio Real-Time Spectrum & Activity Visualizer Bar */}
        <VisualizerBar
          activeNotes={activeNotes}
          activeChordName={activeChordName}
          activeNoteNames={activeNoteNames}
          audioEngineRef={audioEngineRef}
          sustain={sustain}
          isRecording={isRecording}
          isPlaying={isPlaying}
        />

        {/* Compact Studio Control Strip */}
        <div className="w-full">
          <ControlStrip
            currentInstrument={settings.instrument}
            onSelectInstrument={(inst) => updateSettings({ instrument: inst })}
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
          />
        </div>

        {/* Practice Mode Interactive Trainer Bar (Conditional) */}
        {settings.practiceMode && (
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
        <div className="w-full my-auto py-1 sm:py-2 flex justify-center">
          <PianoKeyboard
            visibleKeys={visibleKeys}
            activeNotes={activeNotes}
            sustain={sustain}
            keyboardMapping={keyboardMapping}
            keyLabels={settings.keyLabels}
            baseOctave={settings.baseOctave}
            activeScale={settings.activeScale}
            practiceTargetMidi={settings.practiceMode ? currentPracticeTarget?.midi : null}
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

        {/* Bottom Utility Bar: Sustain Pedal & Help Hint */}
        <div className="w-full flex items-center justify-between px-2 pt-1 pb-1 gap-4 flex-wrap">
          {/* Quick shortcuts hint */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-stone-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">A–K</kbd> Play Keys
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">Z/X</kbd> Octave
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">Space</kbd> Pedal
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">R</kbd> Record
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300">M</kbd> Metronome
            </span>
          </div>

          {/* Dedicated Tactile Sustain Damper Pedal */}
          <div className="ml-auto">
            <SustainPedal sustain={sustain} onToggleSustain={toggleSustain} />
          </div>
        </div>
      </main>

      {/* 3. MODALS */}
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
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        audioLatencyMs={AudioEngine.getInstance().getLatency()}
        midiStatus={midiStatus}
        midiDeviceName={midiDeviceName}
      />

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
